package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Workout struct {
	ID       primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserID   primitive.ObjectID `json:"user_id" bson:"user_id"`
	Exercise string             `json:"exercise" bson:"exercise" binding:"required"`
	Sets     int                `json:"sets" bson:"sets" binding:"required"`
	Reps     int                `json:"reps" bson:"reps" binding:"required"`
	Weight   float64            `json:"weight" bson:"weight" binding:"required"`
	Date     string             `json:"date" bson:"date" binding:"required"`
}
