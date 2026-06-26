import { Model, type Relation } from "@nozbe/watermelondb";
import { date, field, relation, text } from "@nozbe/watermelondb/decorators";
import type { Associations } from "@nozbe/watermelondb/Model";
import type Category from "./Category.model";

class Expense extends Model {
  static table = "expenses";

  static associations: Associations = {
    categories: { type: "belongs_to", key: "category_id" },
  };

  @text("title") title!: string;
  @field("amount") amount!: number;
  @relation("categories", "category_id") category!: Relation<Category>;
  @date("created_at") createdAt!: number;
}

export default Expense;
