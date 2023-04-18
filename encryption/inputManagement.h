#ifndef INPUTMANAGEMENT
#define INPUTMANAGEMENT

#include "main.h"
#define ERRORMSG_INPUT "Invalid input. Proper syntax: salsa20 [-e|-d] [keypath] [inputpath]\n"
#define ERRORMSG_UNKNOWN "Unknown error."
char getMode(char*);
FILE* openOutput(char*, char);

#endif /* INPUTMANAGEMENT */


