import "./icons";
import Router from "./router";
import { cartService } from "./services/cart.service";
import { userService } from "./services/user.service";
import {analyticsService} from "./services/analytics.service";

new Router();
cartService.init();
userService.init();
analyticsService.init();

setTimeout(() => {
  document.body.classList.add("is__ready");
}, 250);
