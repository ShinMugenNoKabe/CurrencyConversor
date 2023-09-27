import express from "express";
import "dotenv/config";
import CurrenciesUtils from "./currencies-utils.js";
import { tokenRouter, validateJWT } from "./jwt-utils.js";

const app = express();
app.use(express.json());
app.use("/currencies", validateJWT);

app.use("/token", tokenRouter);

app.use("/currencies", async (req, res, next) => {
    if (req.currencyUtils) {
        return next();
    }

    const currencies = await CurrenciesUtils.getConversionRatesFromCentralBank();
    req.currencyUtils = new CurrenciesUtils(currencies);

    return next();
});

app.get("/currencies", (req, res) => {
    const { currencyUtils } = req;
    let { amount, from, to } = req.query;

    console.log({ amount, from, to })

    try {
        amount ||= 1;
        amount = Number(amount);

        if (isNaN(amount)) {
            throw new Error("Please send a valid amount.");
        }
    
        from ??= "EUR";
    
        const toCurrencyIsoCodes = to ? to.split(",") : Object.keys(req.currencyUtils.currencies);

        const conversionRates = {};

        toCurrencyIsoCodes.forEach(currencyIsoCode => {
            const toCurrencyIsoCode = currencyIsoCode.trim().toUpperCase();

            conversionRates[toCurrencyIsoCode] = currencyUtils.changeCurrency(
                amount, from, toCurrencyIsoCode
            );
        });

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