const COUNTRY_BOUNDS: Array<{
    code: string;
    name: string;
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
}> = [
    // Switzerland MUST come before France — CH bounding box is a subset of FR
    { code: 'CH', name: 'Switzerland', latMin: 45.8, latMax: 47.9, lngMin: 5.9, lngMax: 10.5 },
    { code: 'FR', name: 'France', latMin: 41.3, latMax: 51.1, lngMin: -5.2, lngMax: 9.6 },
    { code: 'ES', name: 'Spain', latMin: 35.9, latMax: 43.8, lngMin: -9.3, lngMax: 4.3 },
    { code: 'PT', name: 'Portugal', latMin: 36.9, latMax: 42.2, lngMin: -9.5, lngMax: -6.2 },
    { code: 'IT', name: 'Italy', latMin: 36.6, latMax: 47.1, lngMin: 6.6, lngMax: 18.5 },
    { code: 'DE', name: 'Germany', latMin: 47.3, latMax: 55.1, lngMin: 5.9, lngMax: 15.0 },
    { code: 'NL', name: 'Netherlands', latMin: 50.7, latMax: 53.6, lngMin: 3.3, lngMax: 7.2 },
    { code: 'BE', name: 'Belgium', latMin: 49.5, latMax: 51.5, lngMin: 2.5, lngMax: 6.4 },
    { code: 'GB', name: 'United Kingdom', latMin: 49.9, latMax: 60.9, lngMin: -8.2, lngMax: 1.8 },
    { code: 'GR', name: 'Greece', latMin: 34.8, latMax: 41.7, lngMin: 19.4, lngMax: 29.6 },
    { code: 'HR', name: 'Croatia', latMin: 42.4, latMax: 46.6, lngMin: 13.5, lngMax: 19.4 },
    { code: 'US', name: 'United States', latMin: 24.5, latMax: 49.4, lngMin: -125.0, lngMax: -66.9 },
    { code: 'AU', name: 'Australia', latMin: -43.6, latMax: -10.7, lngMin: 113.2, lngMax: 153.6 },
    { code: 'BR', name: 'Brazil', latMin: -33.7, latMax: 5.3, lngMin: -73.9, lngMax: -34.8 },
];

export function getCountryFromCoords(lat: number, lng: number): { code: string; name: string } {
    for (const country of COUNTRY_BOUNDS) {
        if (
            lat >= country.latMin &&
            lat <= country.latMax &&
            lng >= country.lngMin &&
            lng <= country.lngMax
        ) {
            return { code: country.code, name: country.name };
        }
    }
    return { code: 'XX', name: 'Other' };
}

export function countryCodeToFlag(code: string): string {
    return code
        .toUpperCase()
        .split('')
        .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
        .join('');
}
