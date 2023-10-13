import jwt from "jsonwebtoken";
import { Router } from "express";

export const tokenRouter = Router();

const generateJWT = (body) => {
    const { name, surname } = body;

    if (!name || !surname) {
        throw new Error("Please send the name and the surname of the User in the request.");
    }

    return jwt.sign({
        ...body,
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
    },
    process.env.JWT_KEY,
    {
        algorithm: "HS256"
    });
}

export const validateJWT = (req, res, next) => {
    const jwtToken = req.headers["authorization"];

    if (!jwtToken || !jwtToken.startsWith("Bearer ")) {
        return res.status(401).send({
            detail: "Please send the Token in the Authorization Header."
        });
    }

    let decodedJWT = null;

    try {
        const splitToken = jwtToken.split("Bearer ");
        decodedJWT = jwt.verify(splitToken[1], process.env.JWT_KEY);
    } catch (err) {
        return res.status(401).send({
            detail: `An error has ocurred while validating the Token: ${err.message}`
        });
    }
    
    req.user = decodedJWT;

    next();
}

/**
 * @openapi
 * /token:
 *   post:
 *     description: Generates a JWT Token necessary to login to the API.
 *     requestBody:
 *       description: User information
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Returns the generated JWT Token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Detail Response'
 *       401:
 *         description: An error has ocurred while validating the Token, and the actual error message will be returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Detail Response'
 *       404:
 *         description: An error has ocurred while generating the Token, and the actual error message will be returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Detail Response' 
 *         
 */
tokenRouter.post("/", (req, res) => {
    try {
        return res.status(200).send({
            detail: generateJWT(req.body)
        })
    } catch (err) {
        return res.status(404).send({
            detail: `An error has ocurred while generating the Token: ${err.message}`
        })
    }
});