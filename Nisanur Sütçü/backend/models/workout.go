package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Workout struct {
	ID       primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserID   primitive.ObjectID `json:"user_id" bson:"user_id"`
	Type     string             `json:"type" bson:"type"`         // Koşu, Fitness vb.
	Duration int                `json:"duration" bson:"duration"` // Dakika cinsinden
	Date     string             `json:"date" bson:"date"`
}
