import {
  ACTION_RULES,
  BEAN_REWARDS
} from "../../data/upgrades.js";

const ACTION_DIALOGUE = Object.freeze({
  "action:spoon-hit": {
    category: "spoonHit",
    priority: 20
  },
  "action:bucket-smash": {
    category: "bucketSmash",
    priority: 30
  },
  "action:water-cannon": {
    category: "criticalWater",
    priority: 40
  },
  "action:critical-hit": {
    category: "criticalWater",
    priority: 50
  },
  "action:combo-finisher": {
    category: "comboFinisher",
    priority: 60
  }
});

export class ActionSystem {
  constructor({
    upgrades,
    storage,
    random = Math.random,
    eventTarget = globalThis.window
  } = {}) {
    this.upgrades = upgrades;
    this.storage = storage;
    this.random = random;
    this.eventTarget = eventTarget;
  }

  emit(type, detail = {}) {
    this.storage?.recordAction?.(
      type,
      detail.trainingId
    );

    if (
      this.eventTarget?.dispatchEvent &&
      typeof CustomEvent !== "undefined"
    ) {
      this.eventTarget.dispatchEvent(
        new CustomEvent(type, { detail })
      );
    }

    return {
      type,
      ...detail,
      dialogue: ACTION_DIALOGUE[type] || null
    };
  }

  chance(value) {
    return this.random() < value;
  }

  earn(amount, reason, trainingId) {
    const value = Math.max(
      0,
      Math.floor(Number(amount) || 0)
    );

    if (!value) {
      return 0;
    }

    this.storage?.earnBeans(
      value,
      reason,
      trainingId
    );

    this.emit("currency:earned", {
      amount: value,
      reason,
      trainingId,
      beans:
        this.storage?.data.economy
          ?.beans || value
    });

    return value;
  }

  correct({
    combo,
    fever,
    trainingId,
    baseWaterGain
  }) {
    let waterMultiplier = 1;
    let scoreBonus = 0;
    let beans =
      BEAN_REWARDS.correct +
      Math.floor(combo / 3) *
        BEAN_REWARDS.comboStep;

    const actions = [];

    const critical = this.chance(
      ACTION_RULES.criticalHit.chance
    );

    if (critical) {
      waterMultiplier =
        ACTION_RULES.criticalHit
          .waterMultiplier;

      actions.push(
        this.emit("action:critical-hit", {
          trainingId,
          combo,
          waterMultiplier,
          intensity: 0.9
        })
      );

      beans += BEAN_REWARDS.rareEvent;
    }

    if (
      combo >= 3 &&
      this.chance(
        this.upgrades?.effect?.(
          "spoon_level",
          "spoonChance"
        ) || 0
      )
    ) {
      actions.push(
        this.emit("action:spoon-hit", {
          trainingId,
          level:
            this.upgrades?.level?.(
              "spoon_level"
            ) || 0,
          combo,
          damageText: "깡!",
          intensity: Math.min(
            1,
            0.45 + combo / 30
          )
        })
      );
    }

    if (
      combo >=
        ACTION_RULES.bucketSmash
          .minCombo &&
      this.chance(
        ACTION_RULES.bucketSmash.chance
      )
    ) {
      scoreBonus +=
        ACTION_RULES.bucketSmash
          .scoreBonus;

      actions.push(
        this.emit("action:bucket-smash", {
          trainingId,
          level:
            this.upgrades?.level?.(
              "bucket_level"
            ) || 0,
          combo,
          scoreBonus,
          intensity: 0.85
        })
      );
    }

    if (
      fever &&
      this.chance(
        this.upgrades?.effect?.(
          "water_power_level",
          "waterCannonChance"
        ) || 0
      )
    ) {
      actions.push(
        this.emit("action:water-cannon", {
          trainingId,
          level:
            this.upgrades?.level?.(
              "water_power_level"
            ) || 0,
          combo,
          intensity: 0.8
        })
      );
    }

    if (
      ACTION_RULES.comboFinishers.includes(
        combo
      )
    ) {
      const bonus =
        BEAN_REWARDS.comboFinisher[
          combo
        ] || 0;

      beans += bonus;

      actions.push(
        this.emit(
          "action:combo-finisher",
          {
            trainingId,
            combo,
            beans: bonus,
            intensity: 1
          }
        )
      );
    }

    this.earn(
      beans,
      "correct",
      trainingId
    );

    const dialogue = actions
      .map((action) => action.dialogue)
      .filter(Boolean)
      .sort(
        (left, right) =>
          right.priority - left.priority
      )[0] || null;

    return {
      waterMultiplier,
      scoreBonus,
      beans,
      critical,
      actions,
      dialogueCategory:
        dialogue?.category || null,
      waterGainPreview:
        baseWaterGain * waterMultiplier
    };
  }

  penalty({ reason, trainingId }) {
    if (
      this.chance(
        ACTION_RULES.lidDrop.chance
      )
    ) {
      return this.emit(
        "action:lid-drop",
        {
          reason,
          trainingId,
          intensity: 0.65
        }
      );
    }

    return null;
  }

  feverStart({
    form,
    duration,
    tier,
    trainingId
  }) {
    const beans = this.earn(
      BEAN_REWARDS.feverStart,
      "fever_start",
      trainingId
    );

    this.emit("toad:transform", {
      trainingId,
      form,
      duration: Math.round(
        duration * 1000
      ),
      feverTier: tier
    });

    return beans;
  }

  feverTier({
    form,
    tier,
    remaining,
    trainingId
  }) {
    return this.emit("toad:transform", {
      trainingId,
      form,
      duration: Math.round(
        remaining * 1000
      ),
      feverTier: tier
    });
  }

  trainingClear({
    trainingId,
    score
  }) {
    const previousBest =
      this.storage?.getTrainingStats?.(
        trainingId
      )?.bestScore || 0;

    const clearBonus = this.earn(
      BEAN_REWARDS.trainingClear,
      "training_clear",
      trainingId
    );

    const newHighScore =
      Number(score) > previousBest;

    const highScoreBonus = newHighScore
      ? this.earn(
          BEAN_REWARDS.newHighScore,
          "new_high_score",
          trainingId
        )
      : 0;

    return {
      total:
        clearBonus + highScoreBonus,
      clearBonus,
      highScoreBonus,
      newHighScore,
      previousBest
    };
  }

  feverEnd(reason) {
    this.emit("toad:transform-end", {
      form: "normal",
      reason
    });
  }
}
