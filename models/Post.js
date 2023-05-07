const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PostSchema = new Schema(
  {
    title: String,
    summary: String,
    content: String,
    cover: String,
    author: {type: Schema.Types.ObjectId, ref: "user-infos"}
  },
  {
    timestamps: true,
  }
);

const PostModel = model("posts", PostSchema);

module.exports = PostModel;
