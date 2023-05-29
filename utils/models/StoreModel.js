import mongoose from "mongoose"

const StoreSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  isActive: { type: Boolean, required: true, default: false },
  tags: [{ type: String }],
})

const StoreModel = mongoose.model("Active_Stores", StoreSchema)

export default StoreModel
