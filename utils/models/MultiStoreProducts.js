import mongoose from 'mongoose'

const multiStoreProductSchema = new mongoose.Schema({
   shopify_ids: [{
      type: mongoose.Schema.Types.Mixed,
      required: true
   }],
   product: {
      type: mongoose.Schema.Types.Mixed,
   },
})

const MultiStoreProductModel = mongoose.model('multiStoreProduct', multiStoreProductSchema)

export default MultiStoreProductModel
