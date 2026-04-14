type Workout struct {
	ID     primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	Title  string             `json:"title" bson:"title"`
	Reps   int                `json:"reps" bson:"reps"`
	Load   float64            `json:"load" bson:"load"`
	Date   time.Time          `json:"date" bson:"date"`
	UserID string             `json:"user_id" bson:"user_id"`
}