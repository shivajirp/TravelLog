-- CreateTable
CREATE TABLE "place_stats" (
    "place_id" INTEGER NOT NULL,
    "total_reviews" BIGINT NOT NULL DEFAULT 0,
    "total_rating" BIGINT NOT NULL DEFAULT 0,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "place_stats_pkey" PRIMARY KEY ("place_id")
);

-- CreateTable
CREATE TABLE "review_events" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_events_review_id_key" ON "review_events"("review_id");
