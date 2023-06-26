import mongoose from 'mongoose'

const shopifyDataSchema = new mongoose.Schema(
   {
      store: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'Active_Stores'
      },
      id: {
         type: String,
         required: true
      }
   },
   {
      _id: false
   }
)

const multiStoreProductSchema = new mongoose.Schema({
   shopifyData: [shopifyDataSchema],
   product: [{
      type: mongoose.Schema.Types.Mixed
   }]
})

const MultiStoreProductModel = mongoose.model('multiStoreProduct', multiStoreProductSchema)

export default MultiStoreProductModel
