import jwt from "jsonwebtoken";
import { Router } from "express";

export const tokenRouter = Router();

const generateJWT = (body) => {
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

    if (!jwtToken) {
        return res.status(401).send({
            detail: "Please send the Token in the Authorization Header."
        });
    }

    let decodedJWT = null;

    try {
        decodedJWT = jwt.verify(jwtToken, process.env.JWT_KEY);
    } catch (err) {
        return res.status(401).send({
            detail: `An error has ocurred while validating the Token: ${err.message}`
        });
    }
    
    req.user = decodedJWT;

    next();
}

tokenRouter.post("/", (req, res) => {
    return res.status(200).send({
        detail: generateJWT(req.body)
    })
});