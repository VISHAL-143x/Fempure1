import BigNumber from "bignumber.js";
import { ParsedUrlQuery } from "querystring";
import { products } from "./products";

export default function calculatePrice(query: ParsedUrlQuery): BigNumber {
  let amount = new BigNumber(0);
  for ( let [id, quantity]of Object.entries(query) ) {
    const product = products.find(p => p.id === id)
    if (!product) continue; 
    const price = product.priceUsd // changed from sol to usd
    const productQquantity = new BigNumber(quantity as string)
    amount = amount.plus(productQquantity.multipliedBy(price))
  }
  return amount;
}
   