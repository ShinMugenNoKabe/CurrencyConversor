import express from "express";
import "dotenv/config";
import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import CurrenciesUtils from "./currencies-utils.js";
import { tokenRouter, validateJWT } from "./jwt-utils.js";

const app = express();
app.use(express.json());
//app.disable("x-powered-by");

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

/**
 * @openapi
 * /currencies:
 *   get:
 *     description: Returns the current date's Currency Conversion Rates, from the Central European Bank API.
 *     parameters:
 *       - in: query
 *         name: amount
 *         description: The actual amount to convert
 *         type: double
 *         default: 1
 *       - in: query
 *         name: from
 *         description: The original Currency Iso Code
 *         type: string
 *         default: "EUR"
 *       - in: query
 *         name: to
 *         description: A list of Currency Iso Codes that the amount will be converted, based on the original Currency Iso Code, separated by commas. If empty, the amount will be converted to all available currencies
 *         type: string
 *         example: USD,JPY,MXN
 *       
 *     responses:
 *       200:
 *         description: Returns the collection of Currency Iso Codes and their conversion rates from the original Currency Iso Code sent in the request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Currencies'
 *       401:
 *         description: An error has ocurred while validating the Token, and the actual error message will be returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Detail Response' 
 *       404:
 *         description: An error has ocurred while processing the request, and the actual error message will be returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Detail Response' 
 *     security:
 *       - bearerAuth: []
 */
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

        toCurrencyIsoCodes
            .filter(Boolean)
            .forEach(currencyIsoCode => {
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

const options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "Currency Conversion Rates",
            version: "alpha",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                "Detail Response": {
                    type: "object",
                    properties: {
                        detail: {
                            type: "string",
                            description: "The response's return message, can be an error message or the requested and processed body",
                            example: "Return message"
                        }
                    }
                },
                "User": {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            example: "John",
                            required: true
                        },
                        surname: {
                            type: "string",
                            example: "Doe",
                            required: true
                        }
                    }
                },
                "Currencies": {
                    type: "object",
                    description: "An object that represents the Currency Conversion Rates, the keys being the Currency Iso Codes and their values being the actual Conversion Rates.",
                    properties: {
                        "USD": {
                            type: "double",
                            example: 1.0524
                        },
                        "JPY": {
                            type: "double",
                            example: 157.44
                        },
                        "MXN": {
                            type: "double",
                            example: 18.8786
                        }
                    }
                }
            }
        }
    },
    apis: [
        "./src/jwt-utils.js",
        "./src/app.js"
    ]
};

const openapiSpecification = swaggerJsdoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

app.use((req, res) => {
    return res.status(404).send({
        detail: "Endpoint not found"
    });
})

export default app;