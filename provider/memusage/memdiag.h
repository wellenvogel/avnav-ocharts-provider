//  Source file: /advantage/platform/cframe/cframe/pal/memdiag/memdiag.h

/*  Copyright (c) Nokia Siemens Networks 2007,2008,2009 
    The reproduction, transmission or use of this document or its contents is not 
    permitted without express written authority. Offenders will be liable for 
    damages. All rights, including rights created by patent grant or registration
    of a utility model or design, are reserved.
    Technical modifications possible.
    Technical specifications and features are binding only insofar as they are 
    specifically and expressly agreed upon in a written contract.
*/

#ifndef _MEMDIAG_H
#define _MEMDIAG_H

#include <new>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <iostream>
#include <dlfcn.h>

class memdiag {
  public:
  /**
    * print out all entries (or all new entries)
    */
  virtual void printList(FILE *fp,int lastOnly)=0;
  /**
    * empty the list
    */
  virtual void reset()=0;
  static memdiag * instance() {
  void * ip=dlsym(RTLD_DEFAULT,"memdiagInstance");
  if (!ip) return NULL;
  memdiag * (*fptr)() = (memdiag * (*)())ip; 
  return (*fptr)();
  }
  };
#endif

