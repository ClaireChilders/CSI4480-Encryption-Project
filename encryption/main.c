#include "main.h"
#include "libsalsa.h"
#include "inputManagement.h"

int main(int argc, char* argv[]){
	
	FILE* keypath;
	FILE* targetpath;
	FILE* outputpath;
	size_t length;
	char mode;
	unsigned long int counter = 0;

	INT32* key;
	INT32* cipher;
	BYTE* nextwords; /* DATATYPES DEFINED IN LIBSALSA.H */
			    /* WE'RE GOING FOR PURE ANSI C HERE, SO NO STDINT.H */

	key = malloc(32);
	nextwords = malloc(64);
	cipher = malloc(64);

	/* These next few bits are just processing input and checking
	 * to see if the user called the function correctly.
	 */
	if(argc != 4){
		printf(ERRORMSG_INPUT);
		return 0;
	}

	mode = getMode(argv[1]);

	if(mode == '\0'){
		printf(ERRORMSG_INPUT);
		return 0;
	}
	
	/* Opening the specified files for the key and target
	 * and creating a file for output.
	 */
	keypath = fopen(argv[2], "r");
	targetpath = fopen(argv[3], "r");
	if(keypath == NULL || targetpath == NULL){
		printf(ERRORMSG_INPUT);
		return 0;
	}

	outputpath = openOutput(argv[3], mode);
	if(outputpath == NULL){
		printf(ERRORMSG_UNKNOWN);
		return 0;
	}


	/*
	 * Reading first 32 bytes of the key into memory and checking
	 * if the key is actually at least 32 bytes long
	 */

	length = fread(key, 32, 1, keypath);

	if(length != 1){
		printf(ERRORMSG_KEY);
		return 0;
	}

	fclose(keypath);

mainloop:
	/* 
	 * 1: Attempt to read next 64 bytes into memory, 
	 * write how many bytes were actually written to length.
	 *
	 * 2: Generate an array using the key and stream position
	 *
	 * 3: Perform the hash function on the array
	 *
	 * 4: XOR the cipher array with nextwords, truncating result if length < 64
	 *
	 * 5: Increment the counter and go back to step 1 if EOF hasn't been reached
	 */

	length = fread(nextwords, 1, 64, targetpath);

	constructArray(cipher, key, counter);

	transformArray(cipher);

	encryptAndWrite(cipher, nextwords, outputpath, length);

	++counter;

	if(length == 64)
		goto mainloop;

	return 1;
}
