import { Router } from 'express'
import { addProduct, getAllProducts } from "../controllers/Product.controller.js";
import { verifyJWT } from '../middlewares/auth.middlewares.js'
const productRouter = Router();

productRouter.route("/add-product").post(verifyJWT,addProduct);
productRouter.route("/view-products").get(verifyJWT,getAllProducts);
export default productRouter;
