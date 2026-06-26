import { Model, Q, type Query } from "@nozbe/watermelondb";
import { children, lazy, text } from "@nozbe/watermelondb/decorators";
import type { Associations } from "@nozbe/watermelondb/Model";
import { getStartOfMonth, getStartOfNextMonth } from "@/utils/date";
import type Expense from "./Expense.model";

class Category extends Model {
  static table = "categories";

  static associations: Associations = {
    expenses: { type: "has_many", foreignKey: "category_id" },
  };

  @text("name") name!: string;
  @text("color") color!: string;

  @children("expenses") expenses!: Query<Expense>;

  @lazy expensesFromCurrentMonth = this.expenses.extend(
    Q.where("created_at", Q.between(getStartOfMonth(), getStartOfNextMonth())),
  );
}

export default Category;
