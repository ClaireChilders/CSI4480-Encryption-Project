#ifndef LIBSALSA
#define LIBSALSA

#include "main.h"
#include <limits.h>

#define ERRORMSG_KEY "Failed to read key from file. Please make sure the file is at least 32 bytes in size"

/* Defines the comstants specified in the spec */
#define PREDEF1 0x65787061
#define PREDEF2 0x6e642033
#define PREDEF3 0x32206279
#define PREDEF4 0x7465206b


/* 
 *Checks to find a unsigned 8 bit and 32 bit int datatype at compile time.
 * Fails to compile if no such type exists.
 */

#if USHRT_MAX==4294967295
#define INT32 unsigned short
#elif UINT_MAX==4294967295
#define INT32 unsigned int
#elif ULONG_MAX==4294967295
#define INT32 unsigned long
#else
#error No 32 bit unsigned datatype detected. Terminating.
#endif

#if UCHAR_MAX==255
#define BYTE unsigned char
#elif USHRT_MAX==255
#define BYTE unsigned short
#elif UINT_MAX==255
define BYTE unsigned int
#else
#error No byte sized unsigned datatype detected. Terminating.
#endif

void constructArray(INT32*, INT32*, unsigned long int);
void transformArray(INT32*);
void encryptAndWrite(INT32*, BYTE*, FILE*, size_t);

#endif
