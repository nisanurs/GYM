package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type BodyMeasure struct {
	ID       primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserID   primitive.ObjectID `json:"user_id" bson:"user_id"`
	Weight   float64            `json:"weight" bson:"weight" binding:"required"`
	Height   float64            `json:"height" bson:"height" binding:"required"`
	Arm      float64            `json:"arm" bson:"arm"`           // Kol
	Waist    float64            `json:"waist" bson:"waist"`       // Göbek/Bel
	Neck     float64            `json:"neck" bson:"neck"`         // Boyun
	Leg      float64            `json:"leg" bson:"leg"`           // Bacak
	Hip      float64            `json:"hip" bson:"hip"`           // Kalça
	Shoulder float64            `json:"shoulder" bson:"shoulder"` // Omuz genişliği
	FatRate  float64            `json:"fat_rate" bson:"fat_rate"`
	Date     string             `json:"date" bson:"date" binding:"required"`
}
