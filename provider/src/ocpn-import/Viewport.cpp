#include <math.h>
#include "ocpn_types.h"
#include "georef.h"
#include "dychart.h"




//from chartbase.h
//          Projection type enum
typedef enum OcpnProjType
{
      PROJECTION_UNKNOWN,
      PROJECTION_MERCATOR,
      PROJECTION_TRANSVERSE_MERCATOR,
      PROJECTION_POLYCONIC
}_OcpnProjType;

static bool g_bCourseUp=false; 
static bool g_bskew_comp=false;

//------------------------------------------------------------------------------
//    ViewPort Implementation
//------------------------------------------------------------------------------
ViewPort::ViewPort()
{
      bValid = false;
      skew = 0.;
      view_scale_ppm = 1;
      rotation = 0.;
      b_quilt = false;
      pix_height = pix_width = 0;
}

wxPoint ViewPort::GetPixFromLL(double lat, double lon) const
{
      double easting, northing;
      double xlon = lon;

     /*  Make sure lon and lon0 are same phase */
      if(xlon * clon < 0.)
      {
            if(xlon < 0.)
                 xlon += 360.;
            else
                 xlon -= 360.;
      }

      if(fabs(xlon - clon) > 180.)
      {
            if(xlon > clon)
                xlon -= 360.;
            else
                xlon += 360.;
      }

      if(PROJECTION_TRANSVERSE_MERCATOR == m_projection_type)
      {
            //    We calculate northings as referenced to the equator
            //    And eastings as though the projection point is midscreen.

            double tmeasting, tmnorthing;
            double tmceasting, tmcnorthing;
            toTM(clat, clon, 0., clon, &tmceasting, &tmcnorthing);
            toTM(lat, xlon, 0., clon, &tmeasting, &tmnorthing);

//            tmeasting -= tmceasting;
//            tmnorthing -= tmcnorthing;

            northing = tmnorthing - tmcnorthing;
            easting = tmeasting - tmceasting;
      }
      else if(PROJECTION_POLYCONIC == m_projection_type)
      {

            //    We calculate northings as referenced to the equator
            //    And eastings as though the projection point is midscreen.
            double pceasting, pcnorthing;
            toPOLY(clat, clon, 0., clon, &pceasting, &pcnorthing);

            double peasting, pnorthing;
            toPOLY(lat, xlon, 0., clon, &peasting, &pnorthing);

            easting = peasting;
            northing = pnorthing - pcnorthing;
      }

      else
            toSM(lat, xlon, clat, clon, &easting, &northing);


      if(!wxFinite(easting) || !wxFinite(northing))
            return wxPoint(0,0);

      double epix = easting  * view_scale_ppm;
      double npix = northing * view_scale_ppm;
      double dxr = epix;
      double dyr = npix;

      //    Apply VP Rotation
      if(g_bCourseUp)
      {
            dxr = epix * cos ( rotation ) + npix * sin ( rotation );
            dyr = npix * cos ( rotation ) - epix * sin ( rotation );
      }
      wxPoint r;
      //    We definitely need a round() function here
      r.x = ( int ) wxRound ( ( pix_width  / 2 ) + dxr );
      r.y = ( int ) wxRound ( ( pix_height / 2 ) - dyr );

      return r;
}

wxPoint2DDouble ViewPort::GetDoublePixFromLL(double lat, double lon)
{
      double easting, northing;
      double xlon = lon;

      /*  Make sure lon and lon0 are same phase */
      if(xlon * clon < 0.)
      {
            if(xlon < 0.)
                  xlon += 360.;
            else
                  xlon -= 360.;
      }

      if(fabs(xlon - clon) > 180.)
      {
            if(xlon > clon)
                  xlon -= 360.;
            else
                  xlon += 360.;
      }

      if(PROJECTION_TRANSVERSE_MERCATOR == m_projection_type)
      {
            //    We calculate northings as referenced to the equator
            //    And eastings as though the projection point is midscreen.

            double tmeasting, tmnorthing;
            double tmceasting, tmcnorthing;
            toTM(clat, clon, 0., clon, &tmceasting, &tmcnorthing);
            toTM(lat, xlon, 0., clon, &tmeasting, &tmnorthing);

//            tmeasting -= tmceasting;
//            tmnorthing -= tmcnorthing;

            northing = tmnorthing - tmcnorthing;
            easting = tmeasting - tmceasting;
      }
      else if(PROJECTION_POLYCONIC == m_projection_type)
      {

            //    We calculate northings as referenced to the equator
            //    And eastings as though the projection point is midscreen.
            double pceasting, pcnorthing;
            toPOLY(clat, clon, 0., clon, &pceasting, &pcnorthing);

            double peasting, pnorthing;
            toPOLY(lat, xlon, 0., clon, &peasting, &pnorthing);

            easting = peasting;
            northing = pnorthing - pcnorthing;
      }

      else
            toSM(lat, xlon, clat, clon, &easting, &northing);


      if(!wxFinite(easting) || !wxFinite(northing))
            return wxPoint(0,0);

      double epix = easting  * view_scale_ppm;
      double npix = northing * view_scale_ppm;
      double dxr = epix;
      double dyr = npix;

      //    Apply VP Rotation
      if(g_bCourseUp)
      {
            dxr = epix * cos ( rotation ) + npix * sin ( rotation );
            dyr = npix * cos ( rotation ) - epix * sin ( rotation );
      }

      wxPoint2DDouble r;
      //    We definitely need a round() function here
      r.m_x = ( ( pix_width  / 2 ) + dxr );
      r.m_y = ( ( pix_height / 2 ) - dyr );

      return r;
}



void ViewPort::GetLLFromPix(const wxPoint &p, double *lat, double *lon)
{
      int dx = p.x - (pix_width  / 2 );
      int dy = ( pix_height / 2 ) - p.y;

      double xpr = dx;
      double ypr = dy;

      //    Apply VP Rotation
      if(g_bCourseUp)
      {
            xpr = ( dx * cos ( rotation ) ) - ( dy * sin ( rotation ) );
            ypr = ( dy * cos ( rotation ) ) + ( dx * sin ( rotation ) );
      }
      double d_east = xpr / view_scale_ppm;
      double d_north = ypr / view_scale_ppm;


      double slat, slon;
      if(PROJECTION_TRANSVERSE_MERCATOR == m_projection_type)
      {
            double tmceasting, tmcnorthing;
            toTM(clat, clon, 0., clon, &tmceasting, &tmcnorthing);

            fromTM ( d_east, d_north + tmcnorthing, 0., clon, &slat, &slon );
      }
      else if(PROJECTION_POLYCONIC == m_projection_type)
      {
            double polyeasting, polynorthing;
            toPOLY(clat, clon, 0., clon, &polyeasting, &polynorthing);

            fromPOLY ( d_east, d_north + polynorthing, 0., clon, &slat, &slon );
      }

      //TODO  This could be fromSM_ECC to better match some Raster charts
      //      However, it seems that cm93 (and S57) prefer no eccentricity correction
      //      Think about it....
      else
            fromSM ( d_east, d_north, clat, clon, &slat, &slon );


      *lat = slat;

      if(slon < -180.)
            slon += 360.;
      else if(slon > 180.)
            slon -= 360.;
      *lon = slon;
}


wxRegion ViewPort::GetVPRegionIntersect( const wxRegion &Region, size_t n, float *llpoints, int chart_native_scale, wxPoint *ppoints )
{
      //  Calculate the intersection between a given wxRegion (Region) and a polygon specified by lat/lon points.

      //    If the viewpoint is highly overzoomed wrt to chart native scale, the polygon region may be huge.
      //    This can be very expensive, and lead to crashes on some platforms (gtk in particular)
      //    So, look for this case and handle appropriately with respect to the given Region


      if(chart_scale < chart_native_scale / 10)
      {
            //    Make a positive definite vp
            ViewPort vp_positive = *this;
            while(vp_positive.vpBBox.GetMinX() < 0)
            {
                  vp_positive.clon += 360.;
                  wxPoint2DDouble t(360., 0.);
                  vp_positive.vpBBox.Translate(t);
            }


            //    Scan the points one-by-one, so that we can get min/max to make a bbox
            float *pfp = llpoints;
            float lon_max = -10000.;
            float lon_min =  10000.;
            float lat_max = -10000.;
            float lat_min =  10000.;

            for(unsigned int ip=0 ; ip < n ; ip++)
            {
                  lon_max = wxMax(lon_max, pfp[1]);
                  lon_min = wxMin(lon_min, pfp[1]);
                  lat_max = wxMax(lat_max, pfp[0]);
                  lat_min = wxMin(lat_min, pfp[0]);

                  pfp+=2;
            }

            wxBoundingBox chart_box(lon_min, lat_min, lon_max, lat_max);

            //    Case:  vpBBox is completely outside the chart box, or vice versa
            //    Return an empty region
            if(_OUT == chart_box.Intersect((wxBoundingBox&)vp_positive.vpBBox))
            {
                  if(_OUT == chart_box.Intersect((wxBoundingBox&)vpBBox))
                  {
                        // try again with the chart translated 360
                        wxPoint2DDouble rtw(360., 0.);
                        wxBoundingBox trans_box = chart_box;
                        trans_box.Translate( rtw );

                        if(_OUT == trans_box.Intersect((wxBoundingBox&)vp_positive.vpBBox))
                        {
                              if(_OUT == trans_box.Intersect((wxBoundingBox&)vpBBox))
                              {
                                     return wxRegion();
                              }
                        }
                  }
            }

            //    Case:  vpBBox is completely inside the chart box
            if(_IN == chart_box.Intersect((wxBoundingBox&)vp_positive.vpBBox))
            {
                  return Region;
            }

            //    The ViewPort and the chart region overlap in some way....
            //    Create the intersection of the two bboxes
            double cb_minlon = wxMax(chart_box.GetMinX(), vp_positive.vpBBox.GetMinX());
            double cb_maxlon = wxMin(chart_box.GetMaxX(), vp_positive.vpBBox.GetMaxX());
            double cb_minlat = wxMax(chart_box.GetMinY(), vp_positive.vpBBox.GetMinY());
            double cb_maxlat = wxMin(chart_box.GetMaxY(), vp_positive.vpBBox.GetMaxY());

            if(cb_maxlon < cb_minlon)
                  cb_maxlon += 360.;

            wxPoint p1 = GetPixFromLL(cb_maxlat, cb_minlon);  // upper left
            wxPoint p2 = GetPixFromLL(cb_minlat, cb_maxlon);   // lower right

            wxRegion r(p1, p2);
            r.Intersect(Region);
            return r;
      }

      //    More "normal" case

      wxPoint *pp;

      //    Use the passed point buffer if available
      if(ppoints == NULL)
            pp = new wxPoint[n];
      else
            pp = ppoints;

      float *pfp = llpoints;

      for(unsigned int ip=0 ; ip < n ; ip++)
      {
            wxPoint p = GetPixFromLL(pfp[0], pfp[1]);
            pp[ip] = p;
            pfp+=2;
      }



      wxRegion r = wxRegion(n, pp);

      if(NULL == ppoints)
            delete[] pp;

      r.Intersect(Region);
      return r;


}

void ViewPort::SetBoxes(void)
{

        //  In the case where canvas rotation is applied, we need to define a larger "virtual" pixel window size to ensure that
        //  enough chart data is fatched and available to fill the rotated screen.
      rv_rect = wxRect(0, 0, pix_width, pix_height);

        //  Specify the minimum required rectangle in unrotated screen space which will supply full screen data after specified rotation
      if(( g_bskew_comp && (fabs(skew) > .001)) || (fabs(rotation) > .001))
      {
/*
            //  Get four reference "corner" points in rotated space

              //  First, get screen geometry factors
            double pw2 = pix_width / 2;
            double ph2 = pix_height / 2;
            double pix_l = sqrt ( ( pw2 * pw2 ) + ( ph2 * ph2 ) );
            double phi = atan2 ( ph2, pw2 );


              //Rotate the 4 corner points, and get the max rectangle enclosing it
            double rotator = rotation;
            rotator -= skew;

            double a_east = pix_l * cos ( phi + rotator ) ;
            double a_north = pix_l * sin ( phi + rotator ) ;

            double b_east = pix_l * cos ( rotator - phi + PI ) ;
            double b_north = pix_l * sin ( rotator - phi + PI ) ;

            double c_east = pix_l * cos ( phi + rotator + PI ) ;
            double c_north = pix_l * sin ( phi + rotator + PI ) ;

            double d_east = pix_l * cos ( rotator - phi ) ;
            double d_north = pix_l * sin ( rotator - phi ) ;


            int xmin = (int)wxMin( wxMin(a_east, b_east), wxMin(c_east, d_east));
            int xmax = (int)wxMax( wxMax(a_east, b_east), wxMax(c_east, d_east));
            int ymin = (int)wxMin( wxMin(a_north, b_north), wxMin(c_north, d_north));
            int ymax = (int)wxMax( wxMax(a_north, b_north), wxMax(c_north, d_north));

            int dx = xmax - xmin;
            int dy = ymax - ymin;

              //  It is important for MSW build that viewport pixel dimensions be multiples of 4.....
            if(dy % 4)
                  dy+= 4 - (dy%4);
            if(dx % 4)
                  dx+= 4 - (dx%4);

              //  Grow the source rectangle appropriately
            if(fabs(rotator) > .001)
                  rv_rect.Inflate((dx - pix_width)/2, (dy - pix_height)/2);
*/

            double rotator = rotation;
            rotator -= skew;

            int dy = wxRound(fabs(pix_height * cos(rotator)) + fabs(pix_width * sin(rotator)));
            int dx = wxRound(fabs(pix_width * cos(rotator)) + fabs(pix_height * sin(rotator)));

            //  It is important for MSW build that viewport pixel dimensions be multiples of 4.....
            if(dy % 4)
                  dy+= 4 - (dy%4);
            if(dx % 4)
                  dx+= 4 - (dx%4);

              //  Grow the source rectangle appropriately
            if(fabs(rotator) > .001)
                  rv_rect.Inflate((dx - pix_width)/2, (dy - pix_height)/2);

      }

        //  Compute Viewport lat/lon reference points for co-ordinate hit testing

        //  This must be done in unrotated space with respect to full unrotated screen space calculated above
      double rotation_save = rotation;
      SetRotationAngle(0.);


      double lat_ul, lat_ur, lat_lr, lat_ll;
      double lon_ul, lon_ur, lon_lr, lon_ll;


      GetLLFromPix(wxPoint(rv_rect.x                , rv_rect.y),                         &lat_ul, &lon_ul);
      GetLLFromPix(wxPoint(rv_rect.x + rv_rect.width, rv_rect.y),                         &lat_ur, &lon_ur);
      GetLLFromPix(wxPoint(rv_rect.x + rv_rect.width, rv_rect.y + rv_rect.height),        &lat_lr, &lon_lr);
      GetLLFromPix(wxPoint(rv_rect.x                , rv_rect.y + rv_rect.height),        &lat_ll, &lon_ll);


      if(clon < 0.)
      {
            if((lon_ul > 0.)  &&  (lon_ur < 0.) ){ lon_ul -= 360.;  lon_ll -= 360.;}
      }
      else
      {
            if((lon_ul > 0.)  &&  (lon_ur < 0.) ){ lon_ur += 360.;  lon_lr += 360.;}
      }

      if(lon_ur < lon_ul)
      {
            lon_ur += 360.;
            lon_lr += 360.;
      }

      if(lon_ur > 360.)
      {
            lon_ur -= 360.;
            lon_lr -= 360.;
            lon_ul -= 360.;
            lon_ll -= 360.;
      }

      double dlat_min = lat_ul;
      dlat_min = fmin ( dlat_min, lat_ur );
      dlat_min = fmin ( dlat_min, lat_lr );
      dlat_min = fmin ( dlat_min, lat_ll );

      double dlon_min = lon_ul;
      dlon_min = fmin ( dlon_min, lon_ur );
      dlon_min = fmin ( dlon_min, lon_lr );
      dlon_min = fmin ( dlon_min, lon_ll );

      double dlat_max = lat_ul;
      dlat_max = fmax ( dlat_max, lat_ur );
      dlat_max = fmax ( dlat_max, lat_lr );
      dlat_max = fmax ( dlat_max, lat_ll );

      double dlon_max = lon_ur;
      dlon_max = fmax ( dlon_max, lon_ul );
      dlon_max = fmax ( dlon_max, lon_lr );
      dlon_max = fmax ( dlon_max, lon_ll );


        //  Set the viewport lat/lon bounding box appropriately
      vpBBox.SetMin ( dlon_min,  dlat_min );
      vpBBox.SetMax ( dlon_max,  dlat_max );

        // Restore the rotation angle
      SetRotationAngle(rotation_save);
}

 
