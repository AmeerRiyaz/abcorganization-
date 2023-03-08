"use strict";

const { Contract } = require("fabric-contract-api");

const recordObjType = "Record";
class reportContract extends Contract {
    async initLedger(ctx) {
        console.info("============= START : Initialize Ledger ===========");
        const records = [
            {
                id: "id1",
                name: "goods1",
                price: 100.0,
                date: {
                    day: 1,
                    month: 1,
                    year: 2018
                }
            },
            {
                id: "id2",
                name: "goods2",
                price: -90.0,
                date: {
                    day: 12,
                    month: 2,
                    year: 2019
                }
            },
            {
                id: "id3",
                name: "goods3",
                price: 75.0,
                date: {
                    day: 27,
                    month: 5,
                    year: 2020
                }
            }
        ];

        for (const record of records) {
            console.info("datattata",record)
            const compositeKey = ctx.stub.createCompositeKey(recordObjType, [record.id]);
            await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(record)));
        }
        console.info("============= END : Initialize Ledger ===========");
    }


    //invoke new record to add into existing json obj
    async putRecord(ctx,id,name,price,dateString){
       const date = new Date(dateString)
       
       //making new obj 
       const record = {
        id:id,
        name:name,
        price:parseFloat(price),
        date:{
            day:date.getDate(),
            month:date.getMonth(),
            year:date.getFullYear()
        }
        }
        const compositeKey =ctx.stub.createCompositeKey(recordObjType,[id])
        const recordBytes = await ctx.stub.getState(compositeKey);
        if (recordBytes && recordBytes.length > 0) {
            throw new Error(`The record ${record.id} already exists`);
        }
        await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(record)));
       } 

    
    async getAnuualReport(ctx, year){
        const queryString = `{"selector":{"date":{"year":${year}}}, "use_index":["_design/indexYearDoc", "indexYear"]}`;
        return this._getResultsForQueryString(ctx, queryString);
    }
    async generateCustomReport(xctx,queryString){
        return this._getResultsForQueryString(ctx, queryString);
    }
    async _getResultsForQueryString(ctx, queryString) {
        const iteratorPromise = ctx.stub.getQueryResult(queryString);

        let results = [];
        for await (const res of iteratorPromise) {
            results.push(JSON.parse(res.value.toString()));
        }

        return JSON.stringify(results);
    }
}
module.exports = reportContract;