/******************************************************************************
 *
 *
 * Project:  OpenCPN
 * Purpose:  PlugIn Manager Object
 * Author:   David Register
 *
 ***************************************************************************
 *   Copyright (C) 2010 by David S. Register   *
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301,  USA.             *
 ***************************************************************************
 *
 */
#include <wx/wx.h>
#include <wx/dir.h>
#include <wx/filename.h>
#include <wx/aui/aui.h>
#include <wx/statline.h>
#include <wx/tokenzr.h>
#include <wx/app.h>
#include <wx/hashset.h>
#include <wx/hashmap.h>
#ifndef __WXMSW__
#include <cxxabi.h>
#endif // __WXMSW__
#include <stdint.h>
#include <fcntl.h>
#include <errno.h>
#include <wx/gdicmn.h>
#include <wx/fileconf.h>
#include "pluginmanager.h"
#include "ocpndc.h"
#include "georef.h"
#include "Logger.h"
#include "ColorTable.h"
#include "StringHelper.h"


PluginConfigBase baseConfig;
ColorTable *colorTable=NULL;

wxFileConfig *cfgFile=NULL;
static wxFont *scaledFont=NULL;
static wxFont *scaledFontDepth=NULL;

//    Some static helper funtions
//    Scope is local to this module



PlugIn_ViewPort CreatePlugInViewport( const ViewPort &vp)
{
      //    Create a PlugIn Viewport
      ViewPort tvp = vp;
      PlugIn_ViewPort pivp;

      pivp.clat =                   tvp.clat;                   // center point
      pivp.clon =                   tvp.clon;
      pivp.view_scale_ppm =         tvp.view_scale_ppm;
      pivp.skew =                   tvp.skew;
      pivp.rotation =               tvp.rotation;
      pivp.chart_scale =            tvp.chart_scale;
      pivp.pix_width =              tvp.pix_width;
      pivp.pix_height =             tvp.pix_height;
      pivp.rv_rect =                tvp.rv_rect;
      pivp.b_quilt =                tvp.b_quilt;
      pivp.m_projection_type =      tvp.m_projection_type;

      pivp.lat_min =                tvp.GetBBox().GetMinY();
      pivp.lat_max =                tvp.GetBBox().GetMaxY();
      pivp.lon_min =                tvp.GetBBox().GetMinX();
      pivp.lon_max =                tvp.GetBBox().GetMaxX();

      pivp.bValid =                 tvp.IsValid();                 // This VP is valid

      return pivp;
}


//------------------------------------------------------------------------------------------------
//
//          The PlugInToolbarToolContainer Implementation
//
//------------------------------------------------------------------------------------------------
PlugInToolbarToolContainer::PlugInToolbarToolContainer()
{
      bitmap_dusk = NULL;
      bitmap_night = NULL;
    bitmap_day = NULL;
    
}

PlugInToolbarToolContainer::~PlugInToolbarToolContainer()
{
      delete bitmap_dusk;
      delete bitmap_night;
    delete bitmap_day;
    
}



//-----------------------------------------------------------------------------------------------------
//
//          The PlugIn Manager Implementation
//
//-----------------------------------------------------------------------------------------------------
PlugInManager *s_ppim;

PlugInManager::PlugInManager()
{
      
      s_ppim = this;

      

}

PlugInManager::~PlugInManager()
{
}


bool PlugInManager::LoadAllPlugIns(wxString &plugin_dir, wxString spec)
{
      m_plugin_location = plugin_dir;

      wxString msg(_T("PlugInManager searching for PlugIns in location "));
      msg += m_plugin_location;
      LOG_DEBUG(msg);
      if (spec==wxEmptyString){
          spec=_T("*");
      }

#ifdef __WXMSW__
      wxString pispec = wxString::Format(_T("%s_pi.dll"),spec);
#else
#ifdef __WXOSX__
      wxString pispec = wxString::Format(_T("%s_pi.dylib"),spec);
#else
      wxString pispec = wxString::Format(_T("%s_pi.so"),spec);
#endif
#endif

      if(!::wxDirExists(m_plugin_location))
      {
            msg = m_plugin_location;
            msg.Prepend(_T("   Directory "));
            msg.Append(_T(" does not exist."));
            LOG_DEBUG(msg);
            return false;
      }



      wxDir pi_dir(m_plugin_location);

      if(pi_dir.IsOpened())
      {
            wxString plugin_file;
            bool b_more =pi_dir.GetFirst(&plugin_file, pispec);
            while(b_more)
            {
                  wxString file_name = m_plugin_location + _T("/") + plugin_file;

                  bool b_compat = CheckPluginCompatibility(file_name);

                  if(!b_compat)
                  {
                        wxString msg(_("    Incompatible PlugIn detected:"));
                        msg += file_name;
                        LOG_DEBUG(msg);
                  }

                  PlugInContainer *pic = NULL;
                  if(b_compat)
                        pic = LoadPlugIn(file_name);
                  if(pic)
                  {
                        if(pic->m_pplugin)
                        {
                              plugin_array.Add(pic);

                              //    The common name is available without initialization and startup of the PlugIn
                              pic->m_common_name = pic->m_pplugin->GetCommonName();
                              wxString msg;
                              msg.Printf(_T("    PlugInManager: loading plugin %s "), pic->m_common_name );

                              pic->m_cap_flag = pic->m_pplugin->Init();
                              pic->m_bInitState = true;

                              pic->m_short_description = pic->m_pplugin->GetShortDescription();
                              pic->m_long_description = pic->m_pplugin->GetLongDescription();
                              pic->m_version_major = pic->m_pplugin->GetPlugInVersionMajor();
                              pic->m_version_minor = pic->m_pplugin->GetPlugInVersionMinor();
                              pic->m_bitmap = pic->m_pplugin->GetPlugInBitmap();

                        }
                        else        // not loaded
                        {
                              wxString msg;
                              msg.Printf(_T("    PlugInManager: Unloading invalid PlugIn, API version %d "), pic->m_api_version );
                              LOG_DEBUG(msg);

                              pic->m_destroy_fn(pic->m_pplugin);

                              delete pic->m_plibrary;            // This will unload the PlugIn
                              delete pic;
                        }
                  }


                  b_more =pi_dir.GetNext(&plugin_file);
            }

            UpDateChartDataTypes();

            return true;
      }
      else
            return false;
}

bool PlugInManager::UpdatePlugIns()
{
      bool bret = false;

      for(unsigned int i = 0 ; i < plugin_array.GetCount() ; i++)
      {
            PlugInContainer *pic = plugin_array.Item(i);

            if(pic->m_bEnabled && !pic->m_bInitState)
            {
                  wxString msg(_T("PlugInManager: Initializing PlugIn: "));
                  msg += pic->m_plugin_file;
                  LOG_DEBUG(msg);

                  pic->m_cap_flag = pic->m_pplugin->Init();
                  pic->m_pplugin->SetDefaults();
                  pic->m_bInitState = true;
                  pic->m_short_description = pic->m_pplugin->GetShortDescription();
                  pic->m_long_description = pic->m_pplugin->GetLongDescription();
                  pic->m_version_major = pic->m_pplugin->GetPlugInVersionMajor();
                  pic->m_version_minor = pic->m_pplugin->GetPlugInVersionMinor();
                  pic->m_bitmap = pic->m_pplugin->GetPlugInBitmap();
                  bret = true;
            }
            else if(!pic->m_bEnabled && pic->m_bInitState)
            {
                  bret = DeactivatePlugIn(pic);

            }
      }

      UpDateChartDataTypes();

      return bret;
}


bool PlugInManager::UpDateChartDataTypes(void)
{
      bool bret = false;
      
      return bret;
}


bool PlugInManager::DeactivatePlugIn(PlugInContainer *pic)
{
      bool bret = false;

      if(pic)
      {
            wxString msg(_T("PlugInManager: Deactivating PlugIn: "));
                  msg += pic->m_plugin_file;
            LOG_DEBUG(msg);

            pic->m_pplugin->DeInit();

            //    Deactivate (Remove) any ToolbarTools added by this PlugIn
            for(unsigned int i=0; i < m_PlugInToolbarTools.GetCount(); i++)
            {
                  PlugInToolbarToolContainer *pttc = m_PlugInToolbarTools.Item(i);

                  if(pttc->m_pplugin == pic->m_pplugin)
                  {
                        m_PlugInToolbarTools.Remove(pttc);
                        delete pttc;
                  }
             }

            //    Deactivate (Remove) any ContextMenu items addded by this PlugIn
            for(unsigned int i=0; i < m_PlugInMenuItems.GetCount(); i++)
            {
                  PlugInMenuItemContainer *pimis = m_PlugInMenuItems.Item(i);
                  if(pimis->m_pplugin == pic->m_pplugin)
                  {
                        m_PlugInMenuItems.Remove(pimis);
                        delete pimis;
                  }
            }

            pic->m_bInitState = false;
            bret = true;
      }

      return bret;
}





bool PlugInManager::UpdateConfig()
{
      

      return true;
}

bool PlugInManager::UnLoadAllPlugIns()
{
      for(unsigned int i = 0 ; i < plugin_array.GetCount() ; i++)
      {
            PlugInContainer *pic = plugin_array.Item(i);
            wxString msg(_T("PlugInManager: UnLoading PlugIn: "));
            msg += pic->m_plugin_file;
            LOG_DEBUG(msg);

            pic->m_destroy_fn(pic->m_pplugin);

            delete pic->m_plibrary;            // This will unload the PlugIn

            pic->m_bInitState = false;

            delete pic;
      }
      return true;
}

bool PlugInManager::DeactivateAllPlugIns()
{
      for(unsigned int i = 0 ; i < plugin_array.GetCount() ; i++)
      {
            PlugInContainer *pic = plugin_array.Item(i);
            if(pic && pic->m_bEnabled && pic->m_bInitState)
                  DeactivatePlugIn(pic);
      }
      return true;
}


bool PlugInManager::CheckPluginCompatibility(wxString plugin_file)
{
	bool b_compat = true;

#ifdef __WXMSW__

      //    Open the dll, and get the manifest
      HMODULE module = ::LoadLibraryEx(plugin_file.fn_str(), NULL, LOAD_LIBRARY_AS_DATAFILE);
      if (module == NULL)
            return false;
      HRSRC resInfo = ::FindResource(module, MAKEINTRESOURCE(1), RT_MANIFEST); // resource id #1 should be the manifest

	  if(!resInfo)
		 resInfo = ::FindResource(module, MAKEINTRESOURCE(2), RT_MANIFEST); // try resource id #2

	  if (resInfo) {
            HGLOBAL resData = ::LoadResource(module, resInfo);
            DWORD resSize = ::SizeofResource(module, resInfo);
            if (resData && resSize) {
                  const char *res = (const char *)::LockResource(resData); // the manifest
                  if (res) {
                // got the manifest as a char *
                        wxString manifest(res, wxConvUTF8);
						if(wxNOT_FOUND != manifest.Find(_T("VC90.CRT")))	// cannot load with VC90 runtime (i.e. VS2008)
							b_compat = false;
                  }
                  UnlockResource(resData);
            }
            ::FreeResource(resData);
      }
      ::FreeLibrary(module);

 #endif

	  return b_compat;
}


PlugInContainer *PlugInManager::LoadPlugIn(wxString plugin_file)
{
      wxString msg(_T("PlugInManager: Loading PlugIn: "));
      msg += plugin_file;
      LOG_DEBUG(msg);

      PlugInContainer *pic = new PlugInContainer;
      pic->m_plugin_file = plugin_file;

   // load the library
      wxDynamicLibrary *plugin = new wxDynamicLibrary(plugin_file);
      pic->m_plibrary = plugin;     // Save a pointer to the wxDynamicLibrary for later deletion

      if(!plugin->IsLoaded())
      {
            wxString msg(_T("   PlugInManager: Cannot load library: "));
            msg += plugin_file;
            LOG_DEBUG(msg);
            delete plugin;
            delete pic;
            return NULL;
      }


    // load the factory symbols
      create_t* create_plugin = (create_t*)plugin->GetSymbol(_T("create_pi"));
      if (NULL == create_plugin)
      {
            wxString msg(_T("   PlugInManager: Cannot load symbol create_pi: "));
            msg += plugin_file;
            LOG_ERROR(msg);
            delete plugin;
            delete pic;
            return NULL;
      }

      destroy_t* destroy_plugin = (destroy_t*) plugin->GetSymbol(_T("destroy_pi"));
      pic->m_destroy_fn = destroy_plugin;
      if (NULL == destroy_plugin) {
            wxString msg(_T("   PlugInManager: Cannot load symbol destroy_pi: "));
            msg += plugin_file;
            LOG_ERROR(msg);
            delete plugin;
            delete pic;
            return NULL;
      }
      // create an instance of the plugin class
      opencpn_plugin* plug_in = create_plugin(this);

      int api_major = plug_in->GetAPIVersionMajor();
      int api_minor = plug_in->GetAPIVersionMinor();
      int ver = (api_major * 100) + api_minor;
      pic->m_api_version = ver;


      switch(ver)
      {
            case 105:
                  pic->m_pplugin = dynamic_cast<opencpn_plugin*>(plug_in);
                  break;

            case 106:
                  pic->m_pplugin = dynamic_cast<opencpn_plugin_16*>(plug_in);
                  break;

            case 107:
                  pic->m_pplugin = dynamic_cast<opencpn_plugin_17*>(plug_in);
                  break;

            case 108:
                  pic->m_pplugin = dynamic_cast<opencpn_plugin_18*>(plug_in);
                  break;

    case 109:
        pic->m_pplugin = dynamic_cast<opencpn_plugin_19*>(plug_in);
        break;

    case 110:
        pic->m_pplugin = dynamic_cast<opencpn_plugin_110*>(plug_in);
        break;
        
    case 111:
        pic->m_pplugin = dynamic_cast<opencpn_plugin_111*>(plug_in);
        break;
        
    case 112:
        pic->m_pplugin = dynamic_cast<opencpn_plugin_112*>(plug_in);
        break;

    case 113:
        pic->m_pplugin = dynamic_cast<opencpn_plugin_113*>(plug_in);
        break;

    case 114:
        pic->m_pplugin = dynamic_cast<opencpn_plugin_114*>(plug_in);
        break;
        
            default:
                  break;
      }

      if(pic->m_pplugin)
      {
            msg = _T("  ");
            msg += plugin_file;
            wxString msg1;
            msg1.Printf(_T(" Version detected: %d"), ver);
            msg += msg1;
            LOG_DEBUG(msg);
      }
      else
      {
            msg = _T("    ");
            msg += plugin_file;
            wxString msg1 = _T(" cannot be loaded");
            msg += msg1;
            LOG_DEBUG(msg);
      }

      return pic;
}

bool PlugInManager::RenderAllCanvasOverlayPlugIns( ocpnDC &dc, const ViewPort &vp)
{
      

      return true;
}

bool PlugInManager::RenderAllGLCanvasOverlayPlugIns( wxGLContext *pcontext, const ViewPort &vp)
{
      
      return true;
}

void PlugInManager::SendViewPortToRequestingPlugIns( ViewPort &vp )
{
      
}


void PlugInManager::SendCursorLatLonToAllPlugIns( double lat, double lon)
{
      
}






void PlugInManager::SendMessageToAllPlugins(wxString &message_id, wxString &message_body)
{
      for(unsigned int i = 0 ; i < plugin_array.GetCount() ; i++)
      {
            PlugInContainer *pic = plugin_array.Item(i);
            if(pic->m_bEnabled && pic->m_bInitState)
            {
                  if(pic->m_cap_flag & WANTS_PLUGIN_MESSAGING)
                  {
                        switch(pic->m_api_version)
                        {
                              case 106:
                              {
                                    opencpn_plugin_16 *ppi = dynamic_cast<opencpn_plugin_16 *>(pic->m_pplugin);
                                    if(ppi)
                                          ppi->SetPluginMessage(message_id, message_body);
                                    break;
                              }
                              case 107:
                              {
                                    opencpn_plugin_17 *ppi = dynamic_cast<opencpn_plugin_17 *>(pic->m_pplugin);
                                    if(ppi)
                                          ppi->SetPluginMessage(message_id, message_body);
                                    break;
                              }
                case 108:
                case 109:
                case 110:
                case 111:
                case 112:
                case 113:
                case 114:
                {
                    opencpn_plugin_18 *ppi = dynamic_cast<opencpn_plugin_18 *>(pic->m_pplugin);
                    if(ppi)
                        ppi->SetPluginMessage(message_id, message_body);
                    break;
                }
                default:
                                    break;
                        }
                  }
            }
      }
}


void PlugInManager::SendResizeEventToAllPlugIns(int x, int y)
{
      
}

void PlugInManager::SetColorSchemeForAllPlugIns(ColorScheme cs)
{
      for(unsigned int i = 0 ; i < plugin_array.GetCount() ; i++)
      {
            PlugInContainer *pic = plugin_array.Item(i);
            if(pic->m_bEnabled && pic->m_bInitState)
                  pic->m_pplugin->SetColorScheme((PI_ColorScheme)cs);
      }
}



wxString PlugInManager::GetLastError()
{
      return m_last_error_string;
}

wxBitmap *PlugInManager::BuildDimmedToolBitmap(wxBitmap *pbmp_normal, unsigned char dim_ratio)
{
      wxImage img_dup = pbmp_normal->ConvertToImage();

      if(dim_ratio < 200)
      {
              //  Create a dimmed version of the image/bitmap
            int gimg_width = img_dup.GetWidth();
            int gimg_height = img_dup.GetHeight();

            double factor = (double)(dim_ratio) / 256.0;

            for(int iy=0 ; iy < gimg_height ; iy++)
            {
                  for(int ix=0 ; ix < gimg_width ; ix++)
                  {
                        if(!img_dup.IsTransparent(ix, iy))
                        {
                              wxImage::RGBValue rgb(img_dup.GetRed(ix, iy), img_dup.GetGreen(ix, iy), img_dup.GetBlue(ix, iy));
                              wxImage::HSVValue hsv = wxImage::RGBtoHSV(rgb);
                              hsv.value = hsv.value * factor;
                              wxImage::RGBValue nrgb = wxImage::HSVtoRGB(hsv);
                              img_dup.SetRGB(ix, iy, nrgb.red, nrgb.green, nrgb.blue);
                        }
                  }
            }
      }

        //  Make a bitmap
      wxBitmap *ptoolBarBitmap;

#ifdef __WXMSW__
      wxBitmap tbmp(img_dup.GetWidth(),img_dup.GetHeight(),-1);
      wxMemoryDC dwxdc;
      dwxdc.SelectObject(tbmp);

      ptoolBarBitmap = new wxBitmap(img_dup, (wxDC &)dwxdc);
#else
      ptoolBarBitmap = new wxBitmap(img_dup);
#endif

        // store it
      return ptoolBarBitmap;
}


wxArrayString PlugInManager::GetPlugInChartClassNameArray(void)
{
      wxArrayString array;
      for(unsigned int i = 0 ; i < plugin_array.GetCount() ; i++)
      {
            PlugInContainer *pic = plugin_array.Item(i);
            if(pic->m_bEnabled && pic->m_bInitState && (pic->m_cap_flag & INSTALLS_PLUGIN_CHART))
            {
                  wxArrayString carray = pic->m_pplugin->GetDynamicChartClassNameArray();

                  for(unsigned int j = 0 ; j < carray.GetCount() ; j++)
                        array.Add(carray.Item(j));

            }
      }

      //    Scrub the list for duplicates
      //    Corrects a flaw in BSB4 and NVC PlugIns
      unsigned int j=0;
      while(j < array.GetCount())
      {
            wxString test = array.Item(j);
            unsigned int k = j+1;
            while(k < array.GetCount())
            {
                  if(test == array.Item(k))
                  {
                        array.RemoveAt(k);
                        j = -1;
                        break;
                  }
                  else
                        k++;
            }

            j++;
      }


      return array;
}



//----------------------------------------------------------------------------------------------------------
//    The PlugIn CallBack API Implementation
//    The definitions of this API are found in ocpn_plugin.h
//----------------------------------------------------------------------------------------------------------


int InsertPlugInTool(wxString label, wxBitmap *bitmap, wxBitmap *bmpDisabled, wxItemKind kind,
                                          wxString shortHelp, wxString longHelp, wxObject *clientData, int position,
                                          int tool_sel, opencpn_plugin *pplugin)
{
            return -1;
}


void  RemovePlugInTool(int tool_id)
{
      
}

void SetToolbarToolViz(int item, bool viz)
{
      
}

void SetToolbarItemState(int item, bool toggle)
{
      
}

void SetToolbarToolBitmaps(int item, wxBitmap *bitmap, wxBitmap *bmpDisabled)
{
      
}

int AddCanvasContextMenuItem(wxMenuItem *pitem, opencpn_plugin *pplugin )
{
      
            return -1;
}


void SetCanvasContextMenuItemViz(int item, bool viz)
{
      
}

void SetCanvasContextMenuItemGrey(int item, bool grey)
{
      
}


void RemoveCanvasContextMenuItem(int item)
{
      
}



wxWindow *canvas=NULL;

wxWindow *GetOCPNCanvasWindow()
{
    return NULL;
    if (canvas == NULL){
        canvas=new wxWindow(NULL,wxID_ANY);
    }
    return canvas;
}

void RequestRefresh(wxWindow *win)
{
      if(win)
            win->Refresh();
}

void GetCanvasPixLL(PlugIn_ViewPort *vp, wxPoint *pp, double lat, double lon)
{
      //    Make enough of an application viewport to run its method....
      ViewPort ocpn_vp;
      ocpn_vp.clat = vp->clat;
      ocpn_vp.clon = vp->clon;
      ocpn_vp.m_projection_type = vp->m_projection_type;
      ocpn_vp.view_scale_ppm = vp->view_scale_ppm;
      ocpn_vp.skew = vp->skew;
      ocpn_vp.rotation = vp->rotation;
      ocpn_vp.pix_width = vp->pix_width;
      ocpn_vp.pix_height = vp->pix_height;

      wxPoint ret = ocpn_vp.GetPixFromLL(lat, lon);
      pp->x = ret.x;
      pp->y = ret.y;
}

void GetDoubleCanvasPixLL(PlugIn_ViewPort *vp, wxPoint2DDouble *pp, double lat, double lon)
{
    //    Make enough of an application viewport to run its method....
    ViewPort ocpn_vp;
    ocpn_vp.clat = vp->clat;
    ocpn_vp.clon = vp->clon;
    ocpn_vp.m_projection_type = vp->m_projection_type;
    ocpn_vp.view_scale_ppm = vp->view_scale_ppm;
    ocpn_vp.skew = vp->skew;
    ocpn_vp.rotation = vp->rotation;
    ocpn_vp.pix_width = vp->pix_width;
    ocpn_vp.pix_height = vp->pix_height;

    *pp = ocpn_vp.GetDoublePixFromLL(lat, lon);
}

void GetCanvasLLPix( PlugIn_ViewPort *vp, wxPoint p, double *plat, double *plon)
{
            //    Make enough of an application viewport to run its method....
      ViewPort ocpn_vp;
      ocpn_vp.clat = vp->clat;
      ocpn_vp.clon = vp->clon;
      ocpn_vp.m_projection_type = vp->m_projection_type;
      ocpn_vp.view_scale_ppm = vp->view_scale_ppm;
      ocpn_vp.skew = vp->skew;
      ocpn_vp.rotation = vp->rotation;
      ocpn_vp.pix_width = vp->pix_width;
      ocpn_vp.pix_height = vp->pix_height;

      return ocpn_vp.GetLLFromPix( p, plat, plon);
}

bool GetGlobalColor(wxString colorName, wxColour *pcolour)
{
    if (colorTable != NULL){
        ColorTable::iterator it=colorTable->find(colorName);
        if (it != colorTable->end()){
            *pcolour=it->second;
            return true;
        }
    }
    //table not set - or color not found
    wxColour c ;
    if (colorName == wxT("NODTA")){
        c.Set(128,128,128);    
    }
    else{
        c.Set(80,80,80);            
    }
    *pcolour = c;    
    return true;
}

wxFont *OCPNGetFont(wxString TextElement, int default_size)
{
      return NULL;
}

wxString privateDataDir=wxEmptyString;
wxString dataDir=wxEmptyString;
wxString *GetpSharedDataLocation(void)
{
    return &dataDir;
}
wxString GetPluginDataDir(const char* plugin_name){
    return dataDir;
}
wxString *GetpPrivateApplicationDataLocation(){
    return &privateDataDir;
}
wxFileConfig *GetOCPNConfigObject(void)
{   
    return baseConfig.configFile;
    
}

#define PRFX wxT("OpenCPN S52PLIB")
//versions to ensure that the plugin rereads the config
#define OCPN_MAJOR 4
#define OCPN_MINOR 6
//must be called from the main thread!
void setPluginBaseConfig(PluginConfigBase cfg, bool sendJson) {
    LOG_INFO(wxT("setting plugin base config"));
    {
        baseConfig = cfg;
        //we can only set the directories once as we dont know
        //what will happen with the references later - so we should not change anything
        if (privateDataDir == wxEmptyString) {
            privateDataDir = baseConfig.configDir;
        }
        if (dataDir == wxEmptyString) {
            dataDir = baseConfig.s57BaseDir;
        }
        if (scaledFont != NULL){
            delete scaledFont;
            scaledFont=NULL;
        }
        if (scaledFontDepth != NULL){
            delete scaledFontDepth;
            scaledFontDepth=NULL;
        }
    }
    if (sendJson && (s_ppim != NULL)){
        LOG_INFO(wxT("send update json message"));
        wxString jsonMessage=wxString::Format(wxT("{\n"
                    "\"OpenCPN Version Major\":%d,\n"
                    "\"OpenCPN Version Minor\":%d,\n"
                    "\"%s ShowText\":%s,\n"
                    "\"%s ShowSoundings\":%s,\n"
                    "\"%s DisplayCategory\":%d,\n"
                    "\"%s ShowLights\":%s,\n"
                    JSON_IV(%s ShowLightDescription,%s) ",\n"
                    JSON_IV(%s ShowATONLabel,%s) ",\n"
                    JSON_IV(%s ShowImportantTextOnly, %s) ",\n"
                    JSON_IV(%s ShowAnchorConditions, %s) ",\n"   
                    JSON_IV(%s SymbolStyle,%d) ",\n"
                    JSON_IV(%s BoundaryStyle,%d) ",\n"
                    JSON_IV(%s ColorShades,%2.1f) "\n"
                "}"),
                OCPN_MAJOR, 
                OCPN_MINOR,
                PRFX,cfg.bShowS57Text?"true":"false",
                PRFX,cfg.bShowSoundg?"true":"false",
                PRFX,cfg.nDisplayCategory,
                PRFX,cfg.showLights?"true":"false",
                PRFX,PF_BOOL(cfg.bShowLightDescription),
                PRFX,PF_BOOL(cfg.bShowAtonText),
                PRFX,PF_BOOL(cfg.bShowS57ImportantTextOnly),
                PRFX,PF_BOOL(cfg.showAnchorConditions),
                PRFX,cfg.symbolStyle,
                PRFX,cfg.boundaryStyle,
                PRFX,0.0 //set 3 depth shades
                );
        wxString messageId(wxT("OpenCPN Config"));
        LOG_DEBUG("sending plugin config %s",jsonMessage);
        s_ppim->SendMessageToAllPlugins(messageId,jsonMessage);
    }
}

void setColorTable(ColorTable *table){
    colorTable=table;
}


ArrayOfPlugIn_AIS_Targets *GetAISTargetArray(void)
{
      
            return NULL;


      
}


wxAuiManager *GetFrameAuiManager(void)
{
      return NULL;
}

bool AddLocaleCatalog( wxString catalog )
{
		
		return false;
           
}





wxArrayString GetChartDBDirArrayString()
{
	  //TODO
      //return ChartData->GetChartDirArrayString();
	  wxArrayString x;
	  return x;
}

void SendPluginMessage( wxString message_id, wxString message_body )
{
      s_ppim->SendMessageToAllPlugins(message_id, message_body);
}

void DimeWindow(wxWindow *win)
{
      
}

void JumpToPosition(double lat, double lon, double scale)
{
      
}

//-----------------------------------------------------------------------------------------
//    The opencpn_plugin base class implementation
//-----------------------------------------------------------------------------------------

opencpn_plugin::~opencpn_plugin()
{}

int opencpn_plugin::Init(void)
{  return 0; }


bool opencpn_plugin::DeInit(void)
{  return true; }

int opencpn_plugin::GetAPIVersionMajor()
{  return 1; }

int opencpn_plugin::GetAPIVersionMinor()
{  return 2; }

int opencpn_plugin::GetPlugInVersionMajor()
{  return 1; }

int opencpn_plugin::GetPlugInVersionMinor()
{  return 0; }

wxBitmap *opencpn_plugin::GetPlugInBitmap()
{  return NULL; }

wxString opencpn_plugin::GetCommonName()
{
      return _T("BaseClassCommonName");
}

wxString opencpn_plugin::GetShortDescription()
{
      return _T("OpenCPN PlugIn Base Class");
}

wxString opencpn_plugin::GetLongDescription()
{
      return _T("OpenCPN PlugIn Base Class\n\
PlugInManager created this base class");
}



void opencpn_plugin::SetPositionFix(PlugIn_Position_Fix &pfix)
{}

void opencpn_plugin::SetNMEASentence(wxString &sentence)
{}

void opencpn_plugin::SetAISSentence(wxString &sentence)
{}

int opencpn_plugin::GetToolbarToolCount(void)
{  return 0; }

int opencpn_plugin::GetToolboxPanelCount(void)
{  return 0; }

void opencpn_plugin::SetupToolboxPanel(int page_sel, wxNotebook* pnotebook)
{}

void opencpn_plugin::OnCloseToolboxPanel(int page_sel, int ok_apply_cancel)
{}

void opencpn_plugin::ShowPreferencesDialog( wxWindow* parent )
{}

void opencpn_plugin::OnToolbarToolCallback(int id)
{}

void opencpn_plugin::OnContextMenuItemCallback(int id)
{}

bool opencpn_plugin::RenderOverlay(wxMemoryDC *dc, PlugIn_ViewPort *vp)
{  return false; }

void opencpn_plugin::SetCursorLatLon(double lat, double lon)
{}

void opencpn_plugin::SetCurrentViewPort(PlugIn_ViewPort &vp)
{}

void opencpn_plugin::SetDefaults(void)
{}

void opencpn_plugin::ProcessParentResize(int x, int y)
{}

void opencpn_plugin::SetColorScheme(PI_ColorScheme cs)
{}

void opencpn_plugin::UpdateAuiStatus(void)
{}


wxArrayString opencpn_plugin::GetDynamicChartClassNameArray()
{
      wxArrayString array;
      return array;
}


//    Opencpn_Plugin_16 Implementation
opencpn_plugin_16::opencpn_plugin_16(void *pmgr)
      : opencpn_plugin(pmgr)
{
}

opencpn_plugin_16::~opencpn_plugin_16(void)
{}

bool opencpn_plugin_16::RenderOverlay(wxDC &dc, PlugIn_ViewPort *vp)
{  return false; }

void opencpn_plugin_16::SetPluginMessage(wxString &message_id, wxString &message_body)
{}

//    Opencpn_Plugin_17 Implementation
opencpn_plugin_17::opencpn_plugin_17(void *pmgr)
      : opencpn_plugin(pmgr)
{
}

opencpn_plugin_17::~opencpn_plugin_17(void)
{}


bool opencpn_plugin_17::RenderOverlay(wxDC &dc, PlugIn_ViewPort *vp)
{  return false; }

bool opencpn_plugin_17::RenderGLOverlay(wxGLContext *pcontext, PlugIn_ViewPort *vp)
{  return false; }

void opencpn_plugin_17::SetPluginMessage(wxString &message_id, wxString &message_body)
{}


//    Opencpn_Plugin_18 Implementation
opencpn_plugin_18::opencpn_plugin_18(void *pmgr)
      : opencpn_plugin(pmgr)
      {
}

opencpn_plugin_18::~opencpn_plugin_18(void)
{}


bool opencpn_plugin_18::RenderOverlay(wxDC &dc, PlugIn_ViewPort *vp)
{  return false; }

bool opencpn_plugin_18::RenderGLOverlay(wxGLContext *pcontext, PlugIn_ViewPort *vp)
{  return false; }

void opencpn_plugin_18::SetPluginMessage(wxString &message_id, wxString &message_body)
{}

void opencpn_plugin_18::SetPositionFixEx(PlugIn_Position_Fix_Ex &pfix)
{}


//    Opencpn_Plugin_19 Implementation
opencpn_plugin_19::opencpn_plugin_19(void *pmgr)
    : opencpn_plugin_18(pmgr)
{
}

opencpn_plugin_19::~opencpn_plugin_19(void)
{
}

void opencpn_plugin_19::OnSetupOptions(void)
{
}

//    Opencpn_Plugin_110 Implementation
opencpn_plugin_110::opencpn_plugin_110(void *pmgr)
: opencpn_plugin_19(pmgr)
{
}

opencpn_plugin_110::~opencpn_plugin_110(void)
{
}

void opencpn_plugin_110::LateInit(void)
{
}

//    Opencpn_Plugin_111 Implementation
opencpn_plugin_111::opencpn_plugin_111(void *pmgr)
: opencpn_plugin_110(pmgr)
{
}

opencpn_plugin_111::~opencpn_plugin_111(void)
{
}


//    Opencpn_Plugin_112 Implementation
opencpn_plugin_112::opencpn_plugin_112(void *pmgr)
: opencpn_plugin_111(pmgr)
{
}

opencpn_plugin_112::~opencpn_plugin_112(void)
{
}

bool opencpn_plugin_112::MouseEventHook( wxMouseEvent &event )
{
    return false;
}

void opencpn_plugin_112::SendVectorChartObjectInfo(wxString &chart, wxString &feature, wxString &objname, double lat, double lon, double scale, int nativescale)
{
}

//    Opencpn_Plugin_113 Implementation
opencpn_plugin_113::opencpn_plugin_113(void *pmgr)
: opencpn_plugin_112(pmgr)
{
}

opencpn_plugin_113::~opencpn_plugin_113(void)
{
}

bool opencpn_plugin_113::KeyboardEventHook( wxKeyEvent &event )
{
    return false;
}

void opencpn_plugin_113::OnToolbarToolDownCallback(int id) {}
void opencpn_plugin_113::OnToolbarToolUpCallback(int id) {}


//    Opencpn_Plugin_114 Implementation
opencpn_plugin_114::opencpn_plugin_114(void *pmgr)
: opencpn_plugin_113(pmgr)
{
}

opencpn_plugin_114::~opencpn_plugin_114(void)
{
}


//          Helper and interface classes

//-------------------------------------------------------------------------------
//    PlugIn_AIS_Target Implementation
//-------------------------------------------------------------------------------



// ----------------------------------------------------------------------------
// PlugInChartBase Implmentation
//  This class is the base class for Plug-able chart types
// ----------------------------------------------------------------------------

PlugInChartBase::PlugInChartBase()
{}

PlugInChartBase::~PlugInChartBase()
{}

wxString PlugInChartBase::GetFileSearchMask(void)
{
      return _T("");
}

int PlugInChartBase::Init( const wxString& name, int init_flags )
{ return 0;}

//    Accessors

double PlugInChartBase::GetNormalScaleMin(double canvas_scale_factor, bool b_allow_overzoom)
{return 1.0;}

double PlugInChartBase::GetNormalScaleMax(double canvas_scale_factor, int canvas_width)
{ return 2.0e7;}

bool PlugInChartBase::GetChartExtent(ExtentPI *pext)
{ return false; }


wxBitmap& PlugInChartBase::RenderRegionView(const PlugIn_ViewPort& VPoint,
                                              const wxRegion &Region)
{ return wxNullBitmap;}


bool PlugInChartBase::AdjustVP(PlugIn_ViewPort &vp_last, PlugIn_ViewPort &vp_proposed)
{ return false;}

void PlugInChartBase::GetValidCanvasRegion(const PlugIn_ViewPort& VPoint, wxRegion *pValidRegion)
{}

void PlugInChartBase::SetColorScheme(int cs, bool bApplyImmediate)
{}

double PlugInChartBase::GetNearestPreferredScalePPM(double target_scale_ppm)
{ return 1.0; }

wxBitmap *PlugInChartBase::GetThumbnail(int tnx, int tny, int cs)
{ return NULL; }

void PlugInChartBase::ComputeSourceRectangle(const PlugIn_ViewPort &vp, wxRect *pSourceRect)
{}

double PlugInChartBase::GetRasterScaleFactor()
{ return 1.0; }

bool PlugInChartBase::GetChartBits( wxRect& source, unsigned char *pPix, int sub_samp )
{ return false; }

int PlugInChartBase::GetSize_X()
{ return 1; }

int PlugInChartBase::GetSize_Y()
{ return 1; }

void PlugInChartBase::latlong_to_chartpix(double lat, double lon, double &pixx, double &pixy)
{}

void PlugInChartBase::chartpix_to_latlong(double pixx, double pixy, double *plat, double *plon)
{}


// ----------------------------------------------------------------------------
// PlugInChartBaseGL Implementation
//  
// ----------------------------------------------------------------------------

PlugInChartBaseGL::PlugInChartBaseGL()
{}

PlugInChartBaseGL::~PlugInChartBaseGL()
{}

int PlugInChartBaseGL::RenderRegionViewOnGL( const wxGLContext &glc, const PlugIn_ViewPort& VPoint,
                                             const wxRegion &Region, bool b_use_stencil )
{
    return 0;
}

ListOfPI_S57Obj *PlugInChartBaseGL::GetObjRuleListAtLatLon(float lat, float lon, float select_radius,
                                                           PlugIn_ViewPort *VPoint)
{
    return NULL;
}

wxString PlugInChartBaseGL::CreateObjDescriptions( ListOfPI_S57Obj* obj_list )
{
    return _T("");
}

int PlugInChartBaseGL::GetNoCOVREntries()
{
    return 0;
}

int PlugInChartBaseGL::GetNoCOVRTablePoints(int iTable)
{
    return 0;
}

int  PlugInChartBaseGL::GetNoCOVRTablenPoints(int iTable)
{
    return 0;
}

float *PlugInChartBaseGL::GetNoCOVRTableHead(int iTable)
{ 
    return 0;
}


// ----------------------------------------------------------------------------
// PlugInChartBaseExtended Implementation
//  
// ----------------------------------------------------------------------------

PlugInChartBaseExtended::PlugInChartBaseExtended()
{}

PlugInChartBaseExtended::~PlugInChartBaseExtended()
{}

int PlugInChartBaseExtended::RenderRegionViewOnGL( const wxGLContext &glc, const PlugIn_ViewPort& VPoint,
                                             const wxRegion &Region, bool b_use_stencil )
{
    return 0;
}

int PlugInChartBaseExtended::RenderRegionViewOnGLNoText( const wxGLContext &glc, const PlugIn_ViewPort& VPoint,
                                                   const wxRegion &Region, bool b_use_stencil )
{
    return 0;
}

int PlugInChartBaseExtended::RenderRegionViewOnGLTextOnly( const wxGLContext &glc, const PlugIn_ViewPort& VPoint,
                                                   const wxRegion &Region, bool b_use_stencil )
{
    return 0;
}


wxBitmap &PlugInChartBaseExtended::RenderRegionViewOnDCNoText(const PlugIn_ViewPort& VPoint, const wxRegion &Region)
{
    return wxNullBitmap;
}

bool PlugInChartBaseExtended::RenderRegionViewOnDCTextOnly(wxMemoryDC& dc, const PlugIn_ViewPort& VPoint, const wxRegion &Region)
{
    return false;
}

ListOfPI_S57Obj *PlugInChartBaseExtended::GetObjRuleListAtLatLon(float lat, float lon, float select_radius,
                                                           PlugIn_ViewPort *VPoint)
{
    return NULL;
}

wxString PlugInChartBaseExtended::CreateObjDescriptions( ListOfPI_S57Obj* obj_list )
{
    return _T("");
}

int PlugInChartBaseExtended::GetNoCOVREntries()
{
    return 0;
}

int PlugInChartBaseExtended::GetNoCOVRTablePoints(int iTable)
{
    return 0;
}

int  PlugInChartBaseExtended::GetNoCOVRTablenPoints(int iTable)
{
    return 0;
}

float *PlugInChartBaseExtended::GetNoCOVRTableHead(int iTable)
{ 
    return 0;
}

void PlugInChartBaseExtended::ClearPLIBTextList()
{
}




/* API 1.11  */

/* API 1.11  adds some more common functions to avoid unnecessary code duplication */

wxString toSDMM_PlugIn(int NEflag, double a, bool hi_precision)
{
	wxString rt("");
    return rt;
}

wxColour GetBaseGlobalColor(wxString colorName)
{
    wxColor rt;
    GetGlobalColor( colorName,&rt );
    return rt;
}


int OCPNMessageBox_PlugIn(wxWindow *parent,
                          const wxString& message,
                          const wxString& caption,
                          int style, int x, int y)
{
    return 0;
}

wxString GetOCPN_ExePath( void )
{
    return baseConfig.exeDir+wxFileName::GetPathSeparator()+"opencpn";
}

wxString *GetpPlugInLocation()
{
	//TODO
    return new wxString(".");
}

wxString GetWritableDocumentsDir( void )
{
    return wxString("");
}


wxString GetPlugInPath(opencpn_plugin *pplugin)
{
    wxString ret_val;
    //TODO   
    return ret_val;
}

//      API 1.11 Access to Vector PlugIn charts






int PI_GetPLIBSymbolStyle()
{
    return baseConfig.symbolStyle;  
}

int PI_GetPLIBDepthUnitInt()
{
    return baseConfig.depthUnits;
}
void PI_PLIBSetRenderCaps( unsigned int flags )
{
    
}
void PI_PLIBPrepareForNewRender( void )
{
    
}

int PI_GetPLIBBoundaryStyle()
{
    return baseConfig.boundaryStyle;
}
int DECL_EXP PI_GetPLIBStateHash(){
    return baseConfig.settingsSequence;
}

#ifdef USE_S57
//      API 1.11 Access to S52 PLIB
wxString PI_GetPLIBColorScheme()
{
    return _T("");           //ps52plib->GetPLIBColorScheme()
}





bool PI_PLIBObjectRenderCheck( PI_S57Obj *pObj, PlugIn_ViewPort *vp )
{ 
    //TODO
        return false;
    
}

int PI_GetPLIBStateHash()
{
    //TODO
        return 0;
}



bool PI_PLIBSetContext( PI_S57Obj *pObj )
{
    
    return true;
}
    
void PI_UpdateContext(PI_S57Obj *pObj)
{
}

class S57Obj;
class ObjRazRules;
    
void UpdatePIObjectPlibContext( PI_S57Obj *pObj, S57Obj *cobj, ObjRazRules *rzRules )
{
    
}

bool PI_GetObjectRenderBox( PI_S57Obj *pObj, double *lat_min, double *lat_max, double *lon_min, double *lon_max)
{
	return true;
}
    
PI_LUPname PI_GetObjectLUPName( PI_S57Obj *pObj )
{
        return (PI_LUPname)(-1);
    
}

PI_DisPrio PI_GetObjectDisplayPriority( PI_S57Obj *pObj )
{
    
    
    return (PI_DisPrio)(-1);
        
}

PI_DisCat PI_GetObjectDisplayCategory( PI_S57Obj *pObj )
{
    
    return (PI_DisCat)(-1);
    
}
double PI_GetPLIBMarinerSafetyContour()
{
    return 0;
}


void PI_PLIBSetLineFeaturePriority( PI_S57Obj *pObj, int prio )
{
    

}





void PI_PLIBFreeContext( void *pContext )
{

    
}

int PI_PLIBRenderObjectToDC( wxDC *pdc, PI_S57Obj *pObj, PlugIn_ViewPort *vp )
{
    

    return 1;
}

int PI_PLIBRenderAreaToDC( wxDC *pdc, PI_S57Obj *pObj, PlugIn_ViewPort *vp, wxRect rect, unsigned char *pixbuf )
{
    
    
    return 1;
}

int PI_PLIBRenderAreaToGL( const wxGLContext &glcc, PI_S57Obj *pObj, PlugIn_ViewPort *vp, wxRect &render_rect )
{
#ifdef ocpnUSE_GL
    //  Create and populate a compatible s57 Object
    S57Obj cobj;
    chart_context ctx;
    CreateCompatibleS57Object( pObj, &cobj, &ctx );

//    chart_context *pct = (chart_context *)pObj->m_chart_context;

    //  If the PlugIn does not support it nativiely, build a fully described Geomoetry
    
    if( !(gs_plib_flags & PLIB_CAPS_SINGLEGEO_BUFFER) ){
       if(!pObj->geoPtMulti ){                          // only do this once
            PolyTessGeo *tess = (PolyTessGeo *)pObj->pPolyTessGeo;
        
            if(!tess)
                return 1;                       // bail on empty data
                
            PolyTriGroup *ptg = new PolyTriGroup;       // this will leak a little, but is POD
            ptg->tri_prim_head = tess->Get_PolyTriGroup_head()->tri_prim_head; 
            ptg->bsingle_alloc = false;
            ptg->data_type = DATA_TYPE_DOUBLE;
            tess->Set_PolyTriGroup_head(ptg);

            //  Mark this object using geoPtMulti
            //  The malloc will get free'ed when the object is deleted.
            double *pd = (double *)malloc(sizeof(double));
            pObj->geoPtMulti = pd;  //Hack hack
        }            
        cobj.auxParm0 = -6;         // signal that this object render cannot use VBO
        cobj.auxParm1 = -1;         // signal that this object render cannot have single buffer conversion done
    }            
    else {              // it is a newer PLugIn, so can do single buffer conversion and VBOs
        if(pObj->auxParm0 < 1)
            cobj.auxParm0 = -7;         // signal that this object render can use a persistent VBO for area triangle vertices
    }
    

    S52PLIB_Context *pContext = (S52PLIB_Context *)pObj->S52_Context;
    
    //  Set up object SM rendering constants
    sm_parms transform;
    toSM( vp->clat, vp->clon, pObj->chart_ref_lat, pObj->chart_ref_lon, &transform.easting_vp_center, &transform.northing_vp_center );
    
    //  Create and populate a minimally compatible object container
    ObjRazRules rzRules;
    rzRules.obj = &cobj;
    rzRules.LUP = pContext->LUP;
    rzRules.sm_transform_parms = &transform;
    rzRules.child = pContext->ChildRazRules;
    rzRules.next = NULL;
    rzRules.mps = pContext->MPSRulesList;
    
    if(pContext->LUP){
        ViewPort cvp = CreateCompatibleViewport( *vp );
    
    //  Do the render
        ps52plib->RenderAreaToGL( glcc, &rzRules, &cvp );
    
    
    //  Update the PLIB context after the render operation
        UpdatePIObjectPlibContext( pObj, &cobj, &rzRules );
    }
    
#endif    
    return 1;
    
}

int PI_PLIBRenderObjectToGL( const wxGLContext &glcc, PI_S57Obj *pObj,
                                      PlugIn_ViewPort *vp, wxRect &render_rect )
{
    
    
    return 1;
    
}
#endif  //USE_S57

/* API 1.13  */

/* API 1.13  adds some more common functions to avoid unnecessary code duplication */

wxColour GetFontColour_PlugIn(wxString TextElement){
    return *wxBLACK;  //TODO: color for chart text
}

double fromDMM_Plugin( wxString sdms )
{
    return 0;
}

void SetCanvasRotation(double rotation)
{
    ;
}

double GetCanvasTilt()
{
    return 0;
}

void SetCanvasTilt(double tilt)
{
    ;
}

void SetCanvasProjection(int projection)
{
    ;
}

// Play a sound to a given device
bool PlugInPlaySoundEx( wxString &sound_file, int deviceIndex )
{
    

    return false;
}

bool CheckEdgePan_PlugIn( int x, int y, bool dragging, int margin, int delta )
{
    return false;
}

wxBitmap GetIcon_PlugIn(const wxString & name)
{
	return wxBitmap();
}

void SetCursor_PlugIn( wxCursor *pCursor )
{
   
}

void AddChartDirectory( wxString &path )
{
    
}

void ForceChartDBUpdate()
{
    
}

wxDialog *GetActiveOptionsDialog()
{
    return new wxDialog();
}


int PlatformDirSelectorDialog( wxWindow *parent, wxString *file_spec, wxString Title, wxString initDir)
{
    return 0;
}

int PlatformFileSelectorDialog( wxWindow *parent, wxString *file_spec, wxString Title, wxString initDir,
                                                wxString suggestedName, wxString wildcard)
{
    return 0;
}

bool DeleteOptionsPage( wxScrolledWindow* page ){ return true;}






OCPN_downloadEvent::OCPN_downloadEvent(wxEventType commandType, int id)
:wxEvent(id, commandType)
{
    m_stat = OCPN_DL_UNKNOWN;
    m_condition = OCPN_DL_EVENT_TYPE_UNKNOWN;
    m_b_complete = false;
    m_sofarBytes = 0;
}

OCPN_downloadEvent::~OCPN_downloadEvent()
{
}
wxEvent* OCPN_downloadEvent::Clone() const
{
    OCPN_downloadEvent *newevent=new OCPN_downloadEvent(*this);
    newevent->m_stat=this->m_stat;
    newevent->m_condition=this->m_condition;

    newevent->m_totalBytes=this->m_totalBytes;
    newevent->m_sofarBytes=this->m_sofarBytes;
    newevent->m_b_complete=this->m_b_complete;
    
    return newevent;
}
/* API 1.14 */

void PlugInAISDrawGL( wxGLCanvas* glcanvas, const PlugIn_ViewPort &vp )
{
 
}

bool PlugInSetFontColor(const wxString TextElement, const wxColour color)
{
  return true;
}

void toSM_Plugin(double lat, double lon, double lat0, double lon0, double *x, double *y)
{
    toSM(lat, lon, lat0, lon0, x, y);
}
void fromSM_Plugin(double x, double y, double lat0, double lon0, double *lat, double *lon){
    fromSM(x,y,lat0,lon0,lat,lon);
}


wxFont *GetOCPNScaledFont_PlugIn(wxString TextElement, int default_size ){
    if (scaledFont == NULL){
        scaledFont=new wxFont(*wxNORMAL_FONT);
        scaledFont->Scale(baseConfig.baseFontScale);
    }
    return scaledFont;
}
wxFont *FindOrCreateFont_PlugIn(int, wxFontFamily, wxFontStyle, wxFontWeight, bool, wxString const&, wxFontEncoding){
    if (scaledFontDepth == NULL){
        scaledFontDepth=new wxFont(*wxNORMAL_FONT);
        scaledFontDepth->Scale(baseConfig.soundingsFontScale);
    }
    return scaledFontDepth;  
}
wxScrolledWindow *AddOptionsPage( OptionsParentPI parent, wxString title ){
    return NULL;
}
float  GetOCPNChartScaleFactor_Plugin(){
    return 1.0;
}
wxString GetLocaleCanonicalName(){
    return wxString("en_US");
}
wxString PI_GetPLIBColorScheme(){
    return _T(""); 
}

#include <wx/listimpl.cpp>
WX_DEFINE_LIST(ListOfPI_S57Obj);

//this is somehow dirty
//the compiler just needs this - but finally the destructor will always being called from the plugin
//so we can leave it empty here
PI_S57Obj::~PI_S57Obj(){}
