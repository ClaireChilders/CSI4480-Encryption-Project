#include "libsalsa.h"


/* 
 * This function constructs a 4x4 matrix of 32-bit integers from the array 
 * according to the Salsa20 specification. For a nonce, I'm using pseudorandom 
 * numbers seeded by a counter counting how many 64 byte blocks have been 
 * encrypted so far, since just incrementing a block didn't feel like it would 
 * shake the result up enough.
 */

void constructArray(INT32* cipher, INT32* key, unsigned long int counter){

	srand(counter);
	
	cipher[0] = PREDEF1;
	cipher[1] = key[0];
	cipher[2] = key[1];
	cipher[3] = key[2];
	cipher[4] = key[3];
	cipher[5] = PREDEF2;
	cipher[6] = rand();
	cipher[7] = rand();
	cipher[8] = rand();
	cipher[9] = rand();
	cipher[10] = PREDEF3;
	cipher[11] = key[4];
	cipher[12] = key[5];
	cipher[13] = key[6];
	cipher[14] = key[7];
	cipher[15] = PREDEF4;

}


/* 
 * Rotates a given integer "left" by distance bits. e.g. for a rotation of 1:
 * LSB becomes second least significant bit, second becomes third, so on until
 * MSB becomes LSB.
 */

static INT32 leftRotate(INT32 value, int distance){

	return((value << distance) | (value >> (32 - distance)));

}

/* Implementation of the quarterround and doubleround functions as specified */
static void quarterround(INT32* w, INT32* x, INT32* y, INT32* z){
	*x = *x ^ (leftRotate((*w + *z), 7));
	*y = *y ^ (leftRotate((*x + *w), 9));
	*z = *z ^ (leftRotate((*y + *x), 13));
	*w = *w ^ (leftRotate((*z + *y), 18));
}
static void doubleround(INT32* cipher){
	quarterround(&cipher[0], &cipher[4], &cipher[8], &cipher[12]);
	quarterround(&cipher[5], &cipher[9], &cipher[13], &cipher[1]);
	quarterround(&cipher[10], &cipher[14], &cipher[2], &cipher[6]);
	quarterround(&cipher[15], &cipher[3], &cipher[7], &cipher[11]);	

	quarterround(&cipher[0], &cipher[1], &cipher[2], &cipher[3]);
	quarterround(&cipher[5], &cipher[6], &cipher[7], &cipher[4]);
	quarterround(&cipher[10], &cipher[11], &cipher[8], &cipher[9]);
	quarterround(&cipher[15], &cipher[12], &cipher[13], &cipher[14]);
}

/* when passed a cipher matrix, this function makes a copy of it, performs 10
 * doublerounds on the original, then sums the two together.
 */
void transformArray(INT32* cipher){

	INT32* copy;

	int i;

	copy = malloc(64);

	for(i = 0; i < 16; i++){
		copy[i] = cipher[i];
	}

	for(i = 0; i < 10; i++){
		doubleround(cipher);
	}

	for(i = 0; i < 16; i++){
		cipher[i] = cipher[i] + copy[i];
	}

	free(copy);


}

/* 
 * This function breaks the cipher matrix up into bytes, and XORs it byte
 * by byte with the corresponding bytes of the file, writing the result into
 * the new file.
 */
void encryptAndWrite(INT32* cipher, BYTE* nextwords, FILE* outputpath, size_t length){
	BYTE* choppedcopy;
	long unsigned int i;
	BYTE temp;

	choppedcopy = malloc(64);
	memcpy(choppedcopy, cipher, 64);

	for(i = 0; i < length; i++){
		temp = choppedcopy[i] ^ nextwords[i];
		fwrite(&temp, 1, 1, outputpath);
	}

}
