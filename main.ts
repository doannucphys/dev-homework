import { GetRecipes } from "./supporting-files/data-access";
import { ExpectedRecipeSummary, RunTest } from "./supporting-files/testing";

console.clear();
console.log("Expected Result Is:", ExpectedRecipeSummary);

const recipeData = GetRecipes(); // the list of 1 recipe you should calculate the information for
console.log("Recipe Data:", recipeData);
const recipeSummary: any = {}; // the final result to pass into the test function
/*
 * YOUR CODE GOES BELOW THIS, DO NOT MODIFY ABOVE
 * (You can add more imports if needed)
 * */

import { GetProductsForIngredient } from "./supporting-files/data-access";
import {  Product, SupplierProduct, UnitOfMeasure, UoMName, UoMType } from "./supporting-files/models";
import { ConvertUnits, GetCostPerBaseUnit, GetNutrientFactInBaseUnits, SumUnitsOfMeasure } from "./supporting-files/helpers";

// get cheapest supplier for a product
const getBestSupplierPerProduct = (supplierProducts: SupplierProduct[]) => {
    supplierProducts.sort((a, b) =>  GetCostPerBaseUnit(a) - GetCostPerBaseUnit(b));
    return supplierProducts[0];
}

// get cheapest product for an product list
const findBestProduct = (products: Product[]) => {
    // get cost per base unit for each product and sort the list
    products.sort((a, b) =>  {
        const bestSupplier_a = getBestSupplierPerProduct(a.supplierProducts)
        const costPerBaseUnit_a = GetCostPerBaseUnit(bestSupplier_a);

        const bestSupplier_b = getBestSupplierPerProduct(b.supplierProducts)
        const costPerBaseUnit_b = GetCostPerBaseUnit(bestSupplier_b);

        return costPerBaseUnit_a - costPerBaseUnit_b
    });

    return products[0];
}

// list of recipe summaries
const recipeSummaryList: any = [];

// loop through all recipes
recipeData.forEach(recipe => {
    const lineItems = recipe.lineItems;

    // init cheapestCost
    let cheapestCost = 0;

    // current recipe summary
    const currentRecipeSummary: any = {};

    // init nutrientsAtCheapestCost
    const nutrientsAtCheapestCost: any = {Carbohydrates: {}, Fat: {}, Protein: {}, Sodium: {}};

    // loop through all lineItems in a recipe
    lineItems.forEach(lineItem => {

        // get all products for an ingredient
        const products = GetProductsForIngredient(lineItem.ingredient);

        // get the best product for the ingredient
        const bestProduct = findBestProduct(products);

        // get the best supplier for the best product
        const bestSupplier = getBestSupplierPerProduct(bestProduct.supplierProducts);

        // convert the unit of recipe's lineItem unitOfMeasure to grams
        let unitOfMeasureInMass: UnitOfMeasure =  {uomAmount: 0, uomName: UoMName.grams, uomType: UoMType.mass};

        if (lineItem.unitOfMeasure.uomName == UoMName.cups) {
            const UnitOfMeasureInVolum = ConvertUnits(lineItem.unitOfMeasure, UoMName.millilitres, UoMType.volume);
            unitOfMeasureInMass = ConvertUnits(UnitOfMeasureInVolum, UoMName.grams, UoMType.mass);
        } else {
            unitOfMeasureInMass = ConvertUnits(lineItem.unitOfMeasure, UoMName.grams, UoMType.mass);
        }

        // convert the supplier's product unit of measure to grams
        const UnitOfMeasure2 = ConvertUnits(bestSupplier.supplierProductUoM, UoMName.grams, UoMType.mass);

        // get the cost BaseUnit
        const costPerBaseUnit = GetCostPerBaseUnit(Object.assign({}, bestSupplier, {supplierProductUoM: UnitOfMeasure2}));

        // calculate the total cost
        cheapestCost += costPerBaseUnit * unitOfMeasureInMass.uomAmount;

        // calculate the total nutrients
        bestProduct.nutrientFacts.forEach(nutrientFact => {

            // get nutrient facet in base units
            const nutrientFactInBaseUnits = GetNutrientFactInBaseUnits({...nutrientFact});

            // if the nutrient is not in the list, add it
            if (!nutrientsAtCheapestCost[nutrientFactInBaseUnits.nutrientName].quantityAmount) {
                nutrientsAtCheapestCost[nutrientFactInBaseUnits.nutrientName] = nutrientFactInBaseUnits
            } else {
                // if the nutrient is in the list, sum the quantity
                nutrientsAtCheapestCost[nutrientFactInBaseUnits.nutrientName].quantityAmount = SumUnitsOfMeasure(
                    nutrientsAtCheapestCost[nutrientFactInBaseUnits.nutrientName].quantityAmount,  
                    nutrientFactInBaseUnits.quantityAmount
                );
            }
        });
    })

    // cretae the recipe summary
    currentRecipeSummary[recipe.recipeName] = {cheapestCost, nutrientsAtCheapestCost};

    // add the recipe summary to the list
    recipeSummaryList.push(currentRecipeSummary);
})

// get the first recipe summary for testing
Object.assign(recipeSummary, recipeSummaryList[0]);

/*
 * YOUR CODE ABOVE THIS, DO NOT MODIFY BELOW
 * */
RunTest(recipeSummary);

