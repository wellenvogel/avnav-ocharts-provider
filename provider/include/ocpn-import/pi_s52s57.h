/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Info
 * Author:   Andreas Vogel
 *
 ***************************************************************************
 *   Copyright (C) 2010 by Andreas Vogel   *
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

#ifndef PI_S52S57_H
#define PI_S52S57_H

typedef enum _OGRatt_t{
   OGR_INT,
   OGR_INT_LST,
   OGR_REAL,
   OGR_REAL_LST,
   OGR_STR,
}OGRatt_t;

typedef struct _S57attVal {
    void * value;
    OGRatt_t valType;
} S57attVal;

// OGR primitive type
typedef enum _geoPrim_t{
   GEO_POINT,
   GEO_LINE,
   GEO_AREA,
   GEO_META,
   GEO_PRIM,            // number of primitive
}GeoPrim_t;


WX_DEFINE_ARRAY( S57attVal *, wxArrayOfS57attVal );


#endif /* PI_S52S57_H */

