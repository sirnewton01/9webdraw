function signed8dec(val) {
    if (val > 0x7F)
        return -(~(val - 1) & 0xFF);
    else
        return val;
}