package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID          primitive.ObjectID   `json:"id,omitempty" bson:"_id,omitempty"`
	Name          string             `json:"name" bson:"name" binding:"required"`
	Email         string             `json:"email" bson:"email" binding:"required"`
	Password      string             `json:"password" bson:"password" binding:"required"`
	CurrentWeight float64            `json:"current_weight" bson:"current_weight"`
	TargetWeight  float64            `json:"target_weight,omitempty" bson:"target_weight,omitempty"`
	Goal          string             `json:"goal" bson:"goal"`
}
