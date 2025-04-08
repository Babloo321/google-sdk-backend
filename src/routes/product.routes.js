import { Router } from 'express'
import { addProduct, getAllProducts, removeProductByName } from "../controllers/Product.controller.js";
import { verifyJWT } from '../middlewares/auth.middlewares.js'
const productRouter = Router();

productRouter.route("/add-product").post(verifyJWT,addProduct);
productRouter.route("/view-products").get(verifyJWT,getAllProducts);
productRouter.route("/remove").delete(verifyJWT,removeProductByName);
export default productRouter;
