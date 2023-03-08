"use strict";


const { Contract } = require("fabric-contract-api");

const accountObjType = "Account"
const transferObjType = "Transfer"
const depositObjType = "Deposit"
const withDrawObjType = "WithDraw"

class appContract extends Contract {

//init cc
async init(ctx){
    console.info("+++++++++++++++++start+++++++++++++++")
}
 //creating an account in a bank 

 async accountCreate(ctx,id,balance,name,adhar){
    const accountBalance = parseFloat(balance)
    const account = {
        id :id,
        name:name,
        balance:accountBalance,
        adhar:adhar
    }
    //check whether acc exists or not
    if(await this._isCreated(ctx,id)){
        throw new Error('the account exists')
    }
    //if not craete an acc
    else{
const compositekey = ctx.stub.createCompositeKey(accountObjType,[id])
await ctx.stub.putState(compositekey,Buffer.from(JSON.stringify(account)))


    }

 }

 //view account details

 async profile(ctx,id){
const compositekey = ctx.stub.createCompositeKey(accountObjType,[id])
const value = await ctx.stub.getState(compositekey)
const data = value.toString()
//returns the account details 
return data
 }


//change the details of account and add extra fields if needed 
//present added for the change of name of teh acc hiolder
//needs to be modified at the strinf and integer concepts 
async profileChanges(ctx,id,newData){
    //console.info(args)
    //if sdk is there we can add mutiple args 
    //args = JSON.parse(args)
    const compositekey = ctx.stub.createCompositeKey(accountObjType,[id])
const value = await ctx.stub.getState(compositekey)
const data = JSON.parse(value.toString())
console.info("============================",data)
//console,info("============================",args)
const changeData = (newData)
console.info(typeof changeData)

if(typeof changeData==='string')
data.name = changeData
else if(typeof changeData==='number')
data.adhar = changeData

//const compositekey = ctx.stub.createCompositeKey(accountObjType,[id])
await ctx.stub.putState(compositekey,Buffer.from(JSON.stringify(data)))
return data
}


//beneficiaries
 
//transfer from  acc to acc

async transferMoney(ctx,from,to,amount){
    const amountToTransfer = parseFloat(amount);

    if (amount <= 0) {
        throw new Error(`amount to transfer cannot be negative`);
    }
    //get data of accounts 

    const acc1 = await this._getData(ctx,from)
    acc1.balance= acc1.balance-amountToTransfer
    const acc2 = await this._getData(ctx,to)
    acc2.balance= acc2.balance+amountToTransfer

    //pushing the changeed data to the bct 
    const compositeKey = ctx.stub.createCompositeKey(accountObjType, [from]);
    await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(acc1)));
    const compositeKey2 = ctx.stub.createCompositeKey(accountObjType, [to]);
    await ctx.stub.putState(compositeKey2, Buffer.from(JSON.stringify(acc2)));
    const tx= ctx.stub.getTxID()
    //push transfer amount data in the ledger through the transferkey 

    const transferData = {
    from : from ,
    to :to,
    amountTransfer : amountToTransfer,
    txId:tx
    }
const transferKey = ctx.stub.createCompositeKey(transferObjType,[from])

    await ctx.stub.putState(transferKey,Buffer.from(JSON.stringify(transferData)))
    return tx

}





//balance of an account

async balanceOf(ctx,id){
const compositekey = ctx.stub.createCompositeKey(accountObjType,[id])
const value = await ctx.stub.getState(compositekey)
const data = JSON.parse(value.toString())
console.info(data)
console.info(data.balance)
return data.balance


}

//history of userdata


async historyOfUserData(ctx,id){
    const compositekey = ctx.stub.createCompositeKey(accountObjType,[id])
   // const value = await ctx.stub.getState(compositekey)
   // const data = JSON.parse(value.toString())
    //console.info(data)
    const iteratorPromise = ctx.stub.getHistoryForKey(compositekey);
    let history = [];
    for await (const res of iteratorPromise) {
        history.push({
            txId: res.txId,
            value: res.value.toString(),
            isDelete: res.isDelete
        });
    }
    console.info("=====history ",history)

    return JSON.stringify({
        key: id,
        values: history
    });

}

//history of the tx from an user to user

async historyOfTx(ctx,id){

    const transferKey = ctx.stub.createCompositeKey(transferObjType,[id])
 //   const value = await ctx.stub.getState(transferKey)
    const iteratorPromise = ctx.stub.getHistoryForKey(transferKey);
    let history = [];
    for await (const res of iteratorPromise) {
        history.push({
            txId: res.txId,
            value: res.value.toString(),
            isDelete: res.isDelete
        });
    }
    console.info("=====history ",history)

    return JSON.stringify({
        key: id,
        values: history
    });
}
//Deposit amount in the bank acc 
//can deposit money to self or others
async deposit(ctx,id,amount,to){
    const amountToTransfer = parseFloat(amount);

    //add money to balanace
    const compositekey = ctx.stub.createCompositeKey(accountObjType,[id])
    const value =await ctx.stub.getState(compositekey)
    const data = JSON.parse(value.toString())
    data.balance = data.balance+amountToTransfer;
    await ctx.stub.putState(compositekey, Buffer.from(JSON.stringify(value)));
    const tx= ctx.stub.getTxID()

    //updating the depositing money thorigh other tx 
    const depositData = {
        from : id ,
        to :to,
        amountDeposited : amountToTransfer,
        txId:tx
        }
    const depositKey = ctx.stub.createCompositeKey(depositObjType,[from])
    
        await ctx.stub.putState(depositKey,Buffer.from(JSON.stringify(depositData)))
return tx
}

//show all transcations including transfer,deposit,balance of account 
async depositHistory(ctx,id){
    const depositKey= ctx.stub.createCompositeKey(depositObjType,[id])
    const iteratorPromise = ctx.stub.getHistoryForKey(depositKey);
    let history = [];
    for await (const res of iteratorPromise) {
        history.push({
            txId: res.txId,
            value: res.value.toString(),
            isDelete: res.isDelete
        });
    }
    console.info("=====history ",history)

    return JSON.stringify({
        key: id,
        values: history
    });
}

//withdrawal

async withdraw(ctx,id,amount){
    const accountBalance = parseFloat(amount)
    const withdrawKey= ctx.stub.createCompositeKey(withDrawObjType,[id])
    // const acc1 = await this._getData(ctx,id)
    const acc1 = await this._getData(ctx,id)
    acc1.balance= acc1.balance-accountBalance
    const tx= ctx.stub.getTxID()
    const withdrawdata = {
        id:id,
        amount:acc1.balance,
        txId:tx

    }
    await ctx.stub.putState(withdrawKey,Buffer.from(JSON.stringify(withdrawdata)))
return tx
}


async withdrawHistory(ctx,id){
    const withdrawKey= ctx.stub.createCompositeKey(withDrawObjType,[id])
    const iteratorPromise = ctx.stub.getHistoryForKey(withdrawKey);
    let history = [];
    for await (const res of iteratorPromise) {
        history.push({
            txId: res.txId,
            value: res.value.toString(),
            isDelete: res.isDelete
        });
    }
    console.info("=====history ",history)

    return JSON.stringify({
        key: id,
        values: history
    });
}




//list of accounts in the bank 
async listOfAccounts(ctx){

    const iteratorPromise = ctx.stub.getStateByPartialCompositeKey(accountObjType, []);

    let results = [];
    for await (const res of iteratorPromise) {
        const account = JSON.parse(res.value.toString());
        
            results.push(account);
        
    }

    return JSON.stringify(results);
}














 //helper functions
//check whether teh acc exits or not 
 async _isCreated(ctx,id){
const compositeKey = await ctx.stub.createCompositeKey(accountObjType,[id])
const value = await ctx.stub.getState(compositeKey)
console.info(value)
return value && value.length>0

 }

 //get data of account 
 async _getData(ctx,id){
    const compositeKey = ctx.stub.createCompositeKey(accountObjType, [id]);

    const accountBytes = await ctx.stub.getState(compositeKey);
    if (!accountBytes || accountBytes.length === 0) {
        throw new Error(`the account ${id} does not exist`);
    }

    return JSON.parse(accountBytes.toString());
 }



}
module.exports = appContract;
