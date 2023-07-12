const nodes = require("./data/nodes");
const paths = require("./data/paths");
const dict = require("./dict");
const crypto = require("crypto");
const fs = require("fs");

const defaultLogging = true;
//QUESTIONS
//TODO: separation in part 1 and part 2
function createQuestionData() {
  // create a question
  const questions = nodes
    .filter((node) => classifyNode(node, "Question"))
    .map((node) => {
      const question = createQuestion(node);
      question.answers = getAnswers(question.id);
      return question;
    });
  if (defaultLogging) console.log({ questions });
  return questions;
}
function createQuestion(node) {
  const { identity: id, properties } = node.n;
  const { questionText, part } = properties;

  const question = {
    id,
    questionText,
    part,
  };
  return question;
}
function getAnswers(questionId) {
  // get answers for a question
  const answers = paths
    .filter(
      (path) =>
        path.p.start.identity === questionId &&
        path.p.end.labels[0] === "Answer"
    )
    .map((path) => {
      const id = path.p.end.identity;
      const answer = nodes.filter((node) => node.n.identity === id)[0];
      const { properties } = answer.n;
      const { answerText } = properties;
      return {
        id,
        answerText,
      };
    });
  return answers;
}

//RECOMMENDATIONS

function createRecommendationData() {
  // create a recommendation
  const recommendations = nodes
    .filter((node) => classifyNode(node, "Recommendation"))
    .map((node) => {
      const recommendation = createRecommendation(node);
      return recommendation;
    });
  if (defaultLogging) console.log({ recommendations });
  return recommendations;
}

function createRecommendation(node) {
  const { identity: id, properties } = node.n;
  const { text, title } = properties;
  const files = paths
    .filter(
      (path) =>
        path.p.segments[0].relationship.type === "HAS_FILE" &&
        path.p.start.identity === id
    )
    .map((path) => {
      const fileTitle = path.p.end.properties.title;
      const fileName = path.p.end.properties.name;
      return {
        fileTitle,
        fileName,
      };
    });

  const recommendation = {
    id,
    text,
    title,
    files,
  };
  return recommendation;
}

//RULES
function createRules(questions) {
  const rulesObject = {
    rules: createRulesArray(),
    basicConditions: createBasicConditions(questions),
    conditionGroups: createConditionGroups(),
  };
  if (defaultLogging) console.log({ rulesObject });
  return rulesObject;
}

function createBasicConditions(questions) {
  const basicConditions = nodes
    .filter((node) => classifyNode(node, "Condition"))
    .map((node) => {
      const basicCondition = createBasicCondition(node, questions);
      return basicCondition;
    })
    .filter((condition) => condition !== undefined);
  return basicConditions;
}

function createBasicCondition(node, questions) {
  const { properties, identity: id } = node.n;
  const { match } = properties;
  const getQuestionAndAnswerForCondition = (id) => {
    //get the answer id that is connected to the condition
    const answerId = paths
      .filter((path) => path.p.end.identity === id)
      .map((path) => path.p.start.identity)[0];

    //get the question id that is connected to the answer id
    const questionAndAnswerId = questions
      .filter((question) => {
        const { answers } = question;
        const answer = answers.filter((answer) => answer.id === answerId)[0];
        return answer !== undefined;
      })
      .map((question) => {
        const { answers } = question;
        const answer = answers.filter((answer) => answer.id === answerId)[0];
        return { question: question.id, answer: answer.id };
      });
    if (questionAndAnswerId.length === 0) {
      console.log(
        "ERROR: No question and answer found for condition with id: " +
          id +
          ". Skipping this condition."
      );
      return false;
    }
    return {
      answer: questionAndAnswerId[0]?.answer,
      question: questionAndAnswerId[0]?.question,
    };
  };
  const questionAndAnswerId = getQuestionAndAnswerForCondition(id);
  if (!questionAndAnswerId) return;
  const basicCondition = {
    id,
    match,
    ...getQuestionAndAnswerForCondition(id),
  };
  return basicCondition;
}

function createRulesArray() {
  // first maps all relevant relations to rules later all rules with the same condition are merged
  const rulesWithDuplicateConditions = paths
    .filter(
      (path) =>
        path.p.segments[0].relationship.type === "WEIGHTED_RECOMMENDATION"
    )
    .map((path) => {
      const condition = path.p.start.identity;
      const weightedRecommendations = [
        {
          recommendation: path.p.end.identity,
          weight: path.p.segments[0].relationship.properties.weight,
        },
      ];
      const rule = {
        condition,
        weightedRecommendations,
      };
      return rule;
    });
  //merge rules with the same condition
  const rules = [];
  rulesWithDuplicateConditions.forEach((rule) => {
    const { condition, weightedRecommendations } = rule;
    const existingRule = rules.filter(
      (rule) => rule.condition === condition
    )[0];
    if (existingRule) {
      existingRule.weightedRecommendations.push(weightedRecommendations[0]);
    } else {
      rules.push(rule);
    }
  });
  return rules;
}

function createConditionGroups() {
  const conditionGroups = nodes
    .filter((node) => classifyNode(node, "ConditionGroup"))
    .map((node) => {
      const conditionGroup = createConditionGroup(node);
      return conditionGroup;
    });
  return conditionGroups;
}

function createConditionGroup(node) {
  const { identity: id, properties } = node.n;
  const { type } = properties;
  const conditionGroup = {
    id,
    type,
    list: getConditionsForConditionGroup(id),
  };
  return conditionGroup;
}

function getConditionsForConditionGroup(id) {
  const conditions = paths
    .filter(
      (path) =>
        path.p.end.identity === id && path.p.start.labels[0] === "Condition"
    )
    .map((path) => path.p.start.identity);
  return conditions;
}

//HELPERS
function classifyNode(node, type) {
  // classify a node
  return node.n.labels[0] === type;
}

function convertEverythingToString(questions, recommendation, rules) {
  questions.forEach((question) => {
    question.id = question.id.toString();
    question.answers.forEach((answer) => {
      answer.id = answer.id.toString();
    });
  });
  recommendation.recommendations.forEach((recommendation) => {
    recommendation.id = recommendation.id.toString();
  });
  rules.rules.forEach((rule) => {
    rule.condition = rule.condition.toString();
    rule.weightedRecommendations.forEach((weightedRecommendation) => {
      weightedRecommendation.recommendation =
        weightedRecommendation.recommendation.toString();
    });
  });
  rules.basicConditions.forEach((basicCondition) => {
    basicCondition.id = basicCondition.id.toString();
    basicCondition.answer = basicCondition?.answer?.toString();
    basicCondition.question = basicCondition?.question?.toString();
  });
  rules.conditionGroups.forEach((conditionGroup) => {
    conditionGroup.id = conditionGroup.id.toString();
    conditionGroup.list = conditionGroup.list.map((condition) =>
      condition.toString()
    );
  });
}

const questions = createQuestionData();
const recommendationArray = createRecommendationData();
const recommendation = { recommendations: recommendationArray };
const rules = createRules(questions);

convertEverythingToString(questions, recommendation, rules);

const questionsPartOneArray = questions
  .filter((question) => question.part === 1)
  .map((question) => {
    return {
      id: question.id,
      questionText: question.questionText,
      answers: question.answers,
    };
  });
const questionsPartOne = { questions: questionsPartOneArray };
const questionsPartTwoArray = questions
  .filter((question) => question.part === 2)
  .map((question) => {
    return {
      id: question.id,
      questionText: question.questionText,
      answers: question.answers,
    };
  });
const questionsPartTwo = { questions: questionsPartTwoArray };
const errorQuestionParts =
  questions.length !==
  questionsPartOne.questions.length + questionsPartTwo.questions.length;
if (errorQuestionParts)
  console.log(
    "ERROR: Question parts are not correct. Check if all questions have a part assigned."
  );
fs.writeFile(
  "./results/questions_part1.json",
  JSON.stringify(questionsPartOne),
  (err) => {
    if (err) console.log(err);
    else console.log("Updated questions_part1.json", questionsPartOne);
  }
);
fs.writeFile(
  "./results/questions_part2.json",
  JSON.stringify(questionsPartTwo),
  (err) => {
    if (err) console.log(err);
    else console.log("Updated questions_part2.json");
  }
);
fs.writeFile(
  "./results/recommendations.json",
  JSON.stringify(recommendation),
  (err) => {
    if (err) console.log(err);
    else console.log("Updated recommendations.json");
  }
);
fs.writeFile("./results/rules.json", JSON.stringify(rules), (err) => {
  if (err) console.log(err);
  else console.log("Updated rules.json");
});
const glossary = { glossary: [] };
fs.writeFile("./results/glossary.json", JSON.stringify(glossary), (err) => {
  if (err) console.log(err);
  else console.log("Updated glossary.json");
});
