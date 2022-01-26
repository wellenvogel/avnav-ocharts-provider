#ifndef _TESTHELPER_H
#define _TESTHELPER_H
typedef int (*OpenFunction)(const char *pathname, int flags,...);
bool forward(OpenFunction opener,const char *inPipe, const char *outPipe);
#define TESTKEY_ENV "AVNAV_TESTKEY"
#define OCPN_PIPE "/tmp/OCPN_PIPEX"
#define TEST_PIPE_ENV "AVNAV_TEST_PIPE"

#endif