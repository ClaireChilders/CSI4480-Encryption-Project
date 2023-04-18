function validateInput(input) {
    if (
        input == ''
        ||input.includes(' ')
        || input.includes(';')
        || input.includes('-')
        || input.includes('\\')
        || input.includes('=')
    ) {
        return false;
    }
    return true;
}

module.exports = { validateInput };