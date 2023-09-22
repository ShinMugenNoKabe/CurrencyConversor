import express from "express";
import "dotenv/config";
import CurrenciesUtils from "./currencies-utils.js";

const app = express();
app.use(express.json());

app.use("/currencies", async (req, res, next) => {
    const currencies = await CurrenciesUtils.getConversionRatesFromCentralBank();
    req.currencyUtils = new CurrenciesUtils(currencies);

    return next();
});

app.get("/currencies", async (req, res) => {
    return res.status(200).send(req.currencyUtils.currencies);
});

app.get("/currencies/:fromCurrencyIsoCode/:toCurrencyIsoCodes?",
    async (req, res) => {
        const { currencyUtils } = req;
        const { fromCurrencyIsoCode, toCurrencyIsoCodes } = req.params;

        try {
            let conversionRates = {};

            if (toCurrencyIsoCodes) {
                for (const toCurrencyIsoCode of toCurrencyIsoCodes.split(",")) {
                    const toCurrencyIsoCodeTrimmed = toCurrencyIsoCode.trim();
        
                    conversionRates[toCurrencyIsoCodeTrimmed] = currencyUtils.changeCurrency(
                        1, fromCurrencyIsoCode, toCurrencyIsoCodeTrimmed
                    );
                }
            } else {
                Object.keys(req.currencyUtils.currencies).forEach(currencyIsoCode => {
                    conversionRates[currencyIsoCode] = currencyUtils.changeCurrency(
                        1, fromCurrencyIsoCode, currencyIsoCode
                    );
                });
            }
    
            return res.status(200).send(conversionRates);
        } catch (err) {
            return res.status(404).send({
                detail: err.message
            });
        }
});

app.use((req, res) => {
    return res.status(404).send({
        detail: "Endpoint not found"
    });
})

const PORT = process.env.PORT ?? 3_000;

app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`)
});