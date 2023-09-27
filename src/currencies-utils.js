import { XMLParser } from "fast-xml-parser";

export default class CurrenciesUtils {
    constructor(currencies) {
        this.currencies = currencies;
    }

    static getConversionRatesFromCentralBank = async () => {
        const response = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?5eea76ad68408e363ac0a5bd36352a73");
        const currenciesContent = await response.text();
        const parser = new XMLParser({ ignoreAttributes: false });
        const currenciesXML = parser.parse(currenciesContent)["gesmes:Envelope"]["Cube"]["Cube"]["Cube"];

        const currencies = {
            "EUR": 1.00
        };

        currenciesXML.forEach(currency => {
            currencies[currency["@_currency"]] = Number(currency["@_rate"])
        });

        return currencies;
    }

    changeCurrency = (currency, fromCurrencyIsoCode, toCurrencyIsoCode) => {
        return (currency * this.getConversionRate(fromCurrencyIsoCode, toCurrencyIsoCode));
    }
    
    /**
     * @description Calculates and returns the conversion rate between two currencies.
     * @param {*} fromCurrencyIsoCode The original's currency ISO code
     * @param {*} toCurrencyIsoCode The 
     * @returns The conversion rate between the Original and 
     */
    getConversionRate = (fromCurrencyIsoCode, toCurrencyIsoCode) => {
        const fromCurrencyConversionRate = this.currencies[fromCurrencyIsoCode];
        const toCurrencyConversionRate = this.currencies[toCurrencyIsoCode];

        if (!fromCurrencyConversionRate) {
            throw new Error(`The Currency ISO Code '${fromCurrencyIsoCode}' was not found`);
        }

        if (!toCurrencyConversionRate) {
            throw new Error(`The Currency ISO Code '${toCurrencyIsoCode}' was not found`);
        }
        
        return (toCurrencyConversionRate / fromCurrencyConversionRate);
    }
}