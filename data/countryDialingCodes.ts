export interface CountryDialCode {
  code: string;
  name: string;
  dialCode: string;
}

export const countryDialingCodes: CountryDialCode[] = [
  { code: 'CN', name: '中国', dialCode: '+86' },
  { code: 'HK', name: '中国香港', dialCode: '+852' },
  { code: 'MO', name: '中国澳门', dialCode: '+853' },
  { code: 'TW', name: '中国台湾', dialCode: '+886' },
  { code: 'US', name: '美国', dialCode: '+1' },
  { code: 'CA', name: '加拿大', dialCode: '+1' },
  { code: 'GB', name: '英国', dialCode: '+44' },
  { code: 'SG', name: '新加坡', dialCode: '+65' },
  { code: 'JP', name: '日本', dialCode: '+81' },
  { code: 'KR', name: '韩国', dialCode: '+82' },
  { code: 'AU', name: '澳大利亚', dialCode: '+61' },
  { code: 'DE', name: '德国', dialCode: '+49' },
  { code: 'FR', name: '法国', dialCode: '+33' },
  { code: 'IN', name: '印度', dialCode: '+91' },
  { code: 'BR', name: '巴西', dialCode: '+55' },
  { code: 'AE', name: '阿联酋', dialCode: '+971' },
];

