#include "inputManagement.h"

/* Checks to see if the program is in -e or -d mode */
char getMode(char arg[]){
	if(arg[0] != '-' || strlen(arg) != 2) 
		return '\0';

	switch(arg[1]){
		case 'e':
		       	return 'e';
		case 'd': 
			return 'd';
		default: 
			return '\0';
	}
}

/* Opens an output file with the appropriate suffix */
FILE* openOutput(char filepath[], char mode){
	char enccat[5] = {'-', 'e', 'n', 'c', '\0'};
	char deccat[5] = {'-', 'd', 'e', 'c', '\0'};

	switch(mode){
		case 'e':
			strcat(filepath, enccat); /* strcat is fine since i'm concatenating a known length. */
			return fopen(filepath, "w");
		case 'd':
			strcat(filepath, deccat);
			return fopen(filepath, "w");
		default:
			return NULL;
	}			
}
