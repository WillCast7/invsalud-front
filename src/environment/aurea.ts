// api configuration Here!
export const config = {
  apiVersion: 'v1',
  //urlMedia: 'http://190.6.176.222:4200',
  //urlBackend: 'http://190.6.176.222:9090',
  //urlMedia: 'http://auealab.com',
  //urlMedia: 'http://localhost:4200',
  //urlBackend: '/api',
  urlBackend: 'http://localhost:9091',


  // masks
  maskPhone: "000 000 00 00",
  // separator.0 => miles con punto, sin decimales y de longitud variable:
  // 12.345.678 / 900.123.456 / 1.234.567.890 (dinero: 1.500.000).
  // Dependen de thousandSeparator y decimalMarker; sin decimalMarker "," ngx-mask
  // confunde el punto decimal de valores como 1234.56 con el separador de miles.
  maskDni: "separator.0",
  maskMoney: "separator.0",
  thousandSeparator: ".",
  decimalMarker: "," as const
};

// Opciones globales de ngx-mask. Usar en todo provideNgxMask(...) (app.config y componentes)
// para que el pipe `mask` y los inputs formateen con punto de miles sin pasar opciones en cada uso.
export const ngxMaskOptions = {
  thousandSeparator: config.thousandSeparator,
  decimalMarker: config.decimalMarker
};
