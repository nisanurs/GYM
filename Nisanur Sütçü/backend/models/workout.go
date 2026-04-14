package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Workout struct {
	ID       primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserID   primitive.ObjectID `json:"user_id" bson:"user_id"`
	Type     string             `json:"type" bson:"type"`
	Duration int                `json:"duration" bson:"duration"`
	Calories int                `json:"calories" bson:"calories"` // BU SATIR VAR MI?
	Date     string             `json:"date" bson:"date"`
}
