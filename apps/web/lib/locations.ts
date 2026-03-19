// This file contains a curated list of countries and their states/provinces.
// For a full list, consider integrating with an API or a more comprehensive dataset.

export interface Country {
    name: string
    code: string
    states: State[]
}

export interface State {
    name: string
    code: string
}

export const countries: Country[] = [
    {
        name: "Angola",
        code: "AO",
        states: [
            { name: "Bengo", code: "BGO" },
            { name: "Benguela", code: "BGU" },
            { name: "Bié", code: "BIE" },
            { name: "Cabinda", code: "CAB" },
            { name: "Cuando Cubango", code: "CCU" },
            { name: "Cuanza Norte", code: "CNO" },
            { name: "Cuanza Sul", code: "CUS" },
            { name: "Cunene", code: "CNN" },
            { name: "Huambo", code: "HUA" },
            { name: "Huíla", code: "HUI" },
            { name: "Luanda", code: "LUA" },
            { name: "Lunda Norte", code: "LNO" },
            { name: "Lunda Sul", code: "LSU" },
            { name: "Malanje", code: "MAL" },
            { name: "Moxico", code: "MOX" },
            { name: "Namibe", code: "NAM" },
            { name: "Uíge", code: "UIG" },
            { name: "Zaire", code: "ZAI" }
        ]
    },
    {
        name: "Brazil",
        code: "BR",
        states: [
            { name: "Acre", code: "AC" },
            { name: "Alagoas", code: "AL" },
            { name: "Amapá", code: "AP" },
            { name: "Amazonas", code: "AM" },
            { name: "Bahia", code: "BA" },
            { name: "Ceará", code: "CE" },
            { name: "Distrito Federal", code: "DF" },
            { name: "Espírito Santo", code: "ES" },
            { name: "Goiás", code: "GO" },
            { name: "Maranhão", code: "MA" },
            { name: "Mato Grosso", code: "MT" },
            { name: "Mato Grosso do Sul", code: "MS" },
            { name: "Minas Gerais", code: "MG" },
            { name: "Pará", code: "PA" },
            { name: "Paraíba", code: "PB" },
            { name: "Paraná", code: "PR" },
            { name: "Pernambuco", code: "PE" },
            { name: "Piauí", code: "PI" },
            { name: "Rio de Janeiro", code: "RJ" },
            { name: "Rio Grande do Norte", code: "RN" },
            { name: "Rio Grande do Sul", code: "RS" },
            { name: "Rondônia", code: "RO" },
            { name: "Roraima", code: "RR" },
            { name: "Santa Catarina", code: "SC" },
            { name: "São Paulo", code: "SP" },
            { name: "Sergipe", code: "SE" },
            { name: "Tocantins", code: "TO" }
        ]
    },
    {
        name: "Canada",
        code: "CA",
        states: [
            { name: "Alberta", code: "AB" },
            { name: "British Columbia", code: "BC" },
            { name: "Manitoba", code: "MB" },
            { name: "New Brunswick", code: "NB" },
            { name: "Newfoundland and Labrador", code: "NL" },
            { name: "Northwest Territories", code: "NT" },
            { name: "Nova Scotia", code: "NS" },
            { name: "Nunavut", code: "NU" },
            { name: "Ontario", code: "ON" },
            { name: "Prince Edward Island", code: "PE" },
            { name: "Quebec", code: "QC" },
            { name: "Saskatchewan", code: "SK" },
            { name: "Yukon", code: "YT" }
        ]
    },
    {
        name: "Germany",
        code: "DE",
        states: [
            { name: "Baden-Württemberg", code: "BW" },
            { name: "Bavaria", code: "BY" },
            { name: "Berlin", code: "BE" },
            { name: "Brandenburg", code: "BB" },
            { name: "Bremen", code: "HB" },
            { name: "Hamburg", code: "HH" },
            { name: "Hesse", code: "HE" },
            { name: "Lower Saxony", code: "NI" },
            { name: "Mecklenburg-Vorpommern", code: "MV" },
            { name: "North Rhine-Westphalia", code: "NW" },
            { name: "Rhineland-Palatinate", code: "RP" },
            { name: "Saarland", code: "SL" },
            { name: "Saxony", code: "SN" },
            { name: "Saxony-Anhalt", code: "ST" },
            { name: "Schleswig-Holstein", code: "SH" },
            { name: "Thuringia", code: "TH" }
        ]
    },
    {
        name: "Mozambique",
        code: "MZ",
        states: [
            { name: "Cabo Delgado", code: "P" },
            { name: "Gaza", code: "G" },
            { name: "Inhambane", code: "I" },
            { name: "Manica", code: "B" },
            { name: "Maputo (City)", code: "MPM" },
            { name: "Maputo (Province)", code: "L" },
            { name: "Nampula", code: "N" },
            { name: "Niassa", code: "A" },
            { name: "Sofala", code: "S" },
            { name: "Tete", code: "T" },
            { name: "Zambezia", code: "Q" }
        ]
    },
    {
        name: "Portugal",
        code: "PT",
        states: [
            { name: "Açores", code: "20" },
            { name: "Aveiro", code: "01" },
            { name: "Beja", code: "02" },
            { name: "Braga", code: "03" },
            { name: "Bragança", code: "04" },
            { name: "Castelo Branco", code: "05" },
            { name: "Coimbra", code: "06" },
            { name: "Évora", code: "07" },
            { name: "Faro", code: "08" },
            { name: "Guarda", code: "09" },
            { name: "Leiria", code: "10" },
            { name: "Lisboa", code: "11" },
            { name: "Madeira", code: "30" },
            { name: "Portalegre", code: "12" },
            { name: "Porto", code: "13" },
            { name: "Santarém", code: "14" },
            { name: "Setúbal", code: "15" },
            { name: "Viana do Castelo", code: "16" },
            { name: "Vila Real", code: "17" },
            { name: "Viseu", code: "18" }
        ]
    },
    {
        name: "South Africa",
        code: "ZA",
        states: [
            { name: "Eastern Cape", code: "EC" },
            { name: "Free State", code: "FS" },
            { name: "Gauteng", code: "GP" },
            { name: "KwaZulu-Natal", code: "KZN" },
            { name: "Limpopo", code: "LP" },
            { name: "Mpumalanga", code: "MP" },
            { name: "Northern Cape", code: "NC" },
            { name: "North West", code: "NW" },
            { name: "Western Cape", code: "WC" }
        ]
    },
    {
        name: "Spain",
        code: "ES",
        states: [
            { name: "Andalucía", code: "AN" },
            { name: "Aragón", code: "AR" },
            { name: "Asturias", code: "AS" },
            { name: "Cantabria", code: "CB" },
            { name: "Castilla-La Mancha", code: "CM" },
            { name: "Castilla y León", code: "CL" },
            { name: "Cataluña", code: "CT" },
            { name: "Extremadura", code: "EX" },
            { name: "Galicia", code: "GA" },
            { name: "Islas Baleares", code: "IB" },
            { name: "Islas Canarias", code: "CN" },
            { name: "La Rioja", code: "RI" },
            { name: "Madrid", code: "MD" },
            { name: "Murcia", code: "MC" },
            { name: "Navarra", code: "NC" },
            { name: "País Vasco", code: "PV" },
            { name: "Valencia", code: "VC" }
        ]
    },
    {
        name: "United Kingdom",
        code: "GB",
        states: [
            { name: "England", code: "ENG" },
            { name: "Northern Ireland", code: "NIR" },
            { name: "Scotland", code: "SCT" },
            { name: "Wales", code: "WLS" }
        ]
    },
    {
        name: "United States",
        code: "US",
        states: [
            { name: "Alabama", code: "AL" },
            { name: "Alaska", code: "AK" },
            { name: "Arizona", code: "AZ" },
            { name: "Arkansas", code: "AR" },
            { name: "California", code: "CA" },
            { name: "Colorado", code: "CO" },
            { name: "Connecticut", code: "CT" },
            { name: "Delaware", code: "DE" },
            { name: "Florida", code: "FL" },
            { name: "Georgia", code: "GA" },
            { name: "Hawaii", code: "HI" },
            { name: "Idaho", code: "ID" },
            { name: "Illinois", code: "IL" },
            { name: "Indiana", code: "IN" },
            { name: "Iowa", code: "IA" },
            { name: "Kansas", code: "KS" },
            { name: "Kentucky", code: "KY" },
            { name: "Louisiana", code: "LA" },
            { name: "Maine", code: "ME" },
            { name: "Maryland", code: "MD" },
            { name: "Massachusetts", code: "MA" },
            { name: "Michigan", code: "MI" },
            { name: "Minnesota", code: "MN" },
            { name: "Mississippi", code: "MS" },
            { name: "Missouri", code: "MO" },
            { name: "Montana", code: "MT" },
            { name: "Nebraska", code: "NE" },
            { name: "Nevada", code: "NV" },
            { name: "New Hampshire", code: "NH" },
            { name: "New Jersey", code: "NJ" },
            { name: "New Mexico", code: "NM" },
            { name: "New York", code: "NY" },
            { name: "North Carolina", code: "NC" },
            { name: "North Dakota", code: "ND" },
            { name: "Ohio", code: "OH" },
            { name: "Oklahoma", code: "OK" },
            { name: "Oregon", code: "OR" },
            { name: "Pennsylvania", code: "PA" },
            { name: "Rhode Island", code: "RI" },
            { name: "South Carolina", code: "SC" },
            { name: "South Dakota", code: "SD" },
            { name: "Tennessee", code: "TN" },
            { name: "Texas", code: "TX" },
            { name: "Utah", code: "UT" },
            { name: "Vermont", code: "VT" },
            { name: "Virginia", code: "VA" },
            { name: "Washington", code: "WA" },
            { name: "West Virginia", code: "WV" },
            { name: "Wisconsin", code: "WI" },
            { name: "Wyoming", code: "WY" }
        ]
    },
    {
        name: "France",
        code: "FR",
        states: [
            { name: "Auvergne-Rhône-Alpes", code: "ARA" },
            { name: "Bourgogne-Franche-Comté", code: "BFC" },
            { name: "Brittany", code: "BRE" },
            { name: "Centre-Val de Loire", code: "CVL" },
            { name: "Corsica", code: "COR" },
            { name: "Grand Est", code: "GES" },
            { name: "Hauts-de-France", code: "HDF" },
            { name: "Île-de-France", code: "IDF" },
            { name: "Normandy", code: "NOR" },
            { name: "Nouvelle-Aquitaine", code: "NAQ" },
            { name: "Occitanie", code: "OCC" },
            { name: "Pays de la Loire", code: "PDL" },
            { name: "Provence-Alpes-Côte d'Azur", code: "PAC" }
        ]
    },
    {
        name: "Italy",
        code: "IT",
        states: [
            { name: "Abruzzo", code: "65" },
            { name: "Basilicata", code: "77" },
            { name: "Calabria", code: "78" },
            { name: "Campania", code: "72" },
            { name: "Emilia-Romagna", code: "45" },
            { name: "Friuli-Venezia Giulia", code: "36" },
            { name: "Lazio", code: "62" },
            { name: "Liguria", code: "42" },
            { name: "Lombardy", code: "25" },
            { name: "Marche", code: "57" },
            { name: "Molise", code: "67" },
            { name: "Piedmont", code: "21" },
            { name: "Puglia", code: "75" },
            { name: "Sardinia", code: "88" },
            { name: "Sicily", code: "82" },
            { name: "Trentino-Alto Adige", code: "32" },
            { name: "Tuscany", code: "52" },
            { name: "Umbria", code: "55" },
            { name: "Valle d'Aosta", code: "23" },
            { name: "Veneto", code: "34" }
        ]
    },
    {
        name: "Japan",
        code: "JP",
        states: [
            { name: "Hokkaido", code: "01" },
            { name: "Tokyo", code: "13" },
            { name: "Osaka", code: "27" },
            { name: "Kyoto", code: "26" },
            { name: "Kanagawa", code: "14" },
            { name: "Aichi", code: "23" },
            { name: "Fukuoka", code: "40" },
            { name: "Okinawa", code: "47" }
        ]
    },
    {
        name: "Australia",
        code: "AU",
        states: [
            { name: "Australian Capital Territory", code: "ACT" },
            { name: "New South Wales", code: "NSW" },
            { name: "Northern Territory", code: "NT" },
            { name: "Queensland", code: "QLD" },
            { name: "South Australia", code: "SA" },
            { name: "Tasmania", code: "TAS" },
            { name: "Victoria", code: "VIC" },
            { name: "Western Australia", code: "WA" }
        ]
    },
    {
        name: "India",
        code: "IN",
        states: [
            { name: "Andhra Pradesh", code: "AP" },
            { name: "Delhi", code: "DL" },
            { name: "Gujarat", code: "GJ" },
            { name: "Karnataka", code: "KA" },
            { name: "Kerala", code: "KL" },
            { name: "Maharashtra", code: "MH" },
            { name: "Rajasthan", code: "RJ" },
            { name: "Tamil Nadu", code: "TN" },
            { name: "Uttar Pradesh", code: "UP" },
            { name: "West Bengal", code: "WB" }
        ]
    },
    {
        name: "China",
        code: "CN",
        states: [
            { name: "Beijing", code: "BJ" },
            { name: "Guangdong", code: "GD" },
            { name: "Hong Kong", code: "HK" },
            { name: "Shanghai", code: "SH" },
            { name: "Sichuan", code: "SC" },
            { name: "Zhejiang", code: "ZJ" }
        ]
    },
    {
        name: "Mexico",
        code: "MX",
        states: [
            { name: "Aguascalientes", code: "AGU" },
            { name: "Baja California", code: "BCN" },
            { name: "Chihuahua", code: "CHH" },
            { name: "Ciudad de México", code: "CMX" },
            { name: "Jalisco", code: "JAL" },
            { name: "Nuevo León", code: "NLE" },
            { name: "Oaxaca", code: "OAX" },
            { name: "Quintana Roo", code: "ROO" },
            { name: "Yucatán", code: "YUC" }
        ]
    },
    {
        name: "Nigeria",
        code: "NG",
        states: [
            { name: "Abuja", code: "FC" },
            { name: "Lagos", code: "LA" },
            { name: "Kano", code: "KN" },
            { name: "Rivers", code: "RI" },
            { name: "Oyo", code: "OY" }
        ]
    },
    {
        name: "Argentina",
        code: "AR",
        states: [
            { name: "Buenos Aires", code: "BA" },
            { name: "Córdoba", code: "CBA" },
            { name: "Mendoza", code: "MZA" },
            { name: "Santa Fe", code: "SFE" }
        ]
    },
    {
        name: "Netherlands",
        code: "NL",
        states: [
            { name: "Drenthe", code: "DR" },
            { name: "Flevoland", code: "FL" },
            { name: "Friesland", code: "FR" },
            { name: "Gelderland", code: "GE" },
            { name: "Groningen", code: "GR" },
            { name: "Limburg", code: "LI" },
            { name: "North Brabant", code: "NB" },
            { name: "North Holland", code: "NH" },
            { name: "Overijssel", code: "OV" },
            { name: "South Holland", code: "ZH" },
            { name: "Utrecht", code: "UT" },
            { name: "Zeeland", code: "ZE" }
        ]
    }
].sort((a, b) => a.name.localeCompare(b.name))

export function getCountries(): { name: string; code: string }[] {
    return countries.map(c => ({ name: c.name, code: c.code }))
}

export function getStatesByCountry(countryCode: string): State[] {
    const country = countries.find(c => c.code === countryCode)
    return country?.states || []
}

export function getCountryByName(name: string): Country | undefined {
    return countries.find(c => c.name.toLowerCase() === name.toLowerCase())
}
