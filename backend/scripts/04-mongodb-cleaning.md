
# mongodb data cleaning

你好，我现在mongodb中的文档有两种，一种形状是：

{
...,
"info": {
"a_field": "...",
  }
}

一种是
{
...,
"info": {
"b_field": "...",
  }
}

我想把其中有b_field 这个key文档的b_field全部改名为a_field，请问我再mongo shell中应该如何操作？

```js
db.itemDetail.updateMany(
    {"项目信息.主持人曾经参与科研的情况": {$exists: true}},
    {$rename: {"项目信息.主持人曾经参与科研的情况": "项目信息.负责人曾经参与科研的情况"}}
);
```

```js
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 10756,
  modifiedCount: 10756,
  upsertedCount: 0
}
```

```js
db.itemDetail.updateMany(
    {"项目信息.指导教师、企业导师支持情况": {$exists: true}},
    {$rename: {"项目信息.指导教师、企业导师支持情况": "项目信息.指导教师对本项目的支持情况"}}
);
```

```js
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 40087,
  modifiedCount: 40087,
  upsertedCount: 0
}
```

许多文档存在一个嵌套一层的子文档，我确子文档的键不会和文档中的键冲突，请问我应该怎么将子文档展开到文档中？

```js
db.itemDetail.updateMany(
    {},
    [
        {
            $set: {
                // 使用 $mergeObjects 合并根文档和子文档
                merged: { $mergeObjects: ["$$ROOT", "$项目信息"] }
            }
        },
        {
            $replaceRoot: {
                // 将根文档替换为合并后的文档
                newRoot: "$merged"
            }
        },
        {
            $unset: ["项目信息", "merged"] // 可选，移除原始的子文档字段和临时的合并字段
        }
    ],
    { multi: true }
);
```

```js
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 247965,
  modifiedCount: 247576,
  upsertedCount: 0
}
```

好的谢谢。现在处理itemDetail这个collection。我想查看“项目实施时间”这个字段有哪些取值，我应该怎么查询？
我没说清楚，我的意思是，有的值可能出现次数更多，我想看取值次数最多的10个值。

```js
db.itemDetail.aggregate([
    {
        $group: {
            _id: "$项目实施时间",
            count: { $sum: 1 }
        }
    },
    {
        $sort: {
            count: -1
        }
    },
    {
        $limit: 10
    }
])
```

我希望对于任何字段，包括嵌套的字段，只要值为字符串“nan”、“无”、“*”、“text”、"0001-01-01 至 0001-01-01"、“至”、“NULL 至 NULL”的，全部都替换为空字符串，我应该如何操作。

这是一个文档样本，请你以他为标准清洗。

```js
{
  "项目编号": "201710822005",
  "项目名称": "高校校园建筑能耗模拟及节能改造设计---以广东白云学院为例",
  "项目类型": "创新训练项目",
  "项目类别": "",
  "重点支持领域": "",
  "所属学校": "广东白云学院",
  "项目实施时间": "NULL 至 NULL",
  "所属学科门类": "土木建筑工程.",
  "所属专业大类": "",
  "立项时间": "2017-08-01",
  "项目成员": [
    {
      "姓名": "林滔",
      "年级": "*",
      "学号": {
        "$numberLong": "14230316050"
      },
      "所在院系": "*",
      "专业": "*",
      "联系电话": "*",
      "E-mail": "*",
      "是否主持人": "第一主持人"
    },
  ],
  "指导教师": [
    {
      "姓名": "方玲",
      "单位": "",
      "专业技术职务": "讲师",
      "指导教师类型": "第一指导教师"
    }
  ],
  "number": "244736",
  "负责人曾经参与科研的情况": "",
  "指导教师承担科研课题情况": "",
  "指导教师对本项目的支持情况": "",
  "项目简介": "创造舒适而健康的室内热建筑是本次项目的主要目的。"
}
```

```js
db.itemDetail.find().forEach(function(doc) {

    var badTerms = ["nan", "无", "*", "text", "0001-01-01 至 0001-01-01", "至", "NULL 至 NULL"];

    var cleanDocument = function(obj) {
        for (var key in obj) {
          var value = obj[key];
            if (typeof value === 'object' && value !== null) {
                cleanDocument(obj[key]);
            } else if (badTerms.includes(value)) {
                obj[key] = "";
            }
        }
        return obj;
    };

    doc = cleanDocument(doc);

    try{
      db.itemDetail.updateOne({ _id: doc._id }, { $set: doc });
    }
    catch(err) {
      console.log(err);
      console.log(doc);
    }
});
```

在mongodb中，我发现有的文档中存在键为空字符串的情况，请问如何删掉文档中键为空字符串的键值对？我的collection是itemDetail

参考：[https://jira.mongodb.org/browse/SERVER-6852]

谢谢，但你的代码没法成功运行“MongoServerError: An empty update path is not valid.”，我的想法是，创建一个新的文档，里面的数据都是原来的数据（但不包含空字符串键的），存到一个新的collection“itemDetailCleaned”中。

```js
db.itemDetail.find().forEach(function(doc) {
    var newDoc = {};
    for (var key in doc) {
        if (key !== "") {
            newDoc[key] = doc[key];
        }
    }
    db.itemDetailCleaned.insertOne(newDoc);
});
```

collection“itemDetailCleaned”中，许多文档中的“项目成员”字段（array[obj]）列表中的子文档的“学号”字段类型是numberLong，请问怎么把它们转换为字符串？

```js
db.itemDetailCleaned.find().forEach(function(doc) {
    var update = false;
    if (doc.项目成员 && Array.isArray(doc.项目成员)) {
        doc.项目成员.forEach(function(member) {
            if (member.学号 && typeof member.学号 === 'number') {
                member.学号 = member.学号.toString();
                update = true;
            }
        });
    }
    if (update) {
        db.itemDetailCleaned.updateOne({ _id: doc._id }, { $set: { 项目成员: doc.项目成员 } });
    }
});
```

“所属学科门类”是一个字符串字段，我希望去除字符串前后的空字符（空格、换行等）以及点"."，并且更新文档，请问应该怎么写？
请问除了foreach脚本之外还有更高效的写法吗？

```js
db.itemDetailCleaned.aggregate([
    {
        $set: {
            所属学科门类: {
                $replaceAll: {
                    input: { $trim: { input: "$所属学科门类" } },
                    find: ".",
                    replacement: ""
                }
            }
        }
    },
    {
        $merge: {
            into: "itemDetailCleaned",
            on: "_id",
            whenMatched: "replace"
        }
    }
]);
```

了解了，我希望创建一个“年份”字符串类型的字段，其中的值是“项目编号”字符串字段的前四位，应该如何实现？

```js
db.itemDetailCleaned.aggregate([
    {
        $addFields: {
            年份: { $substr: ["$项目编号", 0, 4] }
        }
    },
    {
        $merge: {
            into: "itemDetailCleaned",
            on: "_id",
            whenMatched: "replace"
        }
    }
]);
```

谢谢，我发现有的"年份"值为"S202"，应该是他的“项目编号”比较特殊，现在我想把它们找出来，并且将其值更新为["$项目编号", 1, 5]，应该如何操作？

```js
db.itemDetailCleaned.updateMany(
    { 年份: "S202" },
    [
        {
            $set: {
                年份: { $substr: ["$项目编号", 1, 4] }
            }
        }
    ]
);
```

```js
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 7925,
  modifiedCount: 7925,
  upsertedCount: 0
}
```

好的，有的“年份”字段值为为“1038”和“1409”，经检查发现“项目编号”中没有年份信息，需要从“立项时间”字符串字段中截取前四位更新为年份。但有的立项时间为空字符串，我应该怎么做？
如果直接 “年份: { $substr: ["$立项时间", 1, 4] }”，是不是就直接空字符串了？

```js
db.itemDetailCleaned.updateMany(
    { 年份: { $in: ["1038", "1409"] } },
    [
        {
            $set: {
                年份: { $substr: ["$立项时间", 1, 4] }
            }
        }
    ]
);

```

```js
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 311,
  modifiedCount: 311,
  upsertedCount: 0
}
```

```js
db.itemDetailCleaned.updateMany(
    { 年份: "017-" },
    [
        {
            $set: {
                年份: '2017'
            }
        }
    ]
);
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 230,
  modifiedCount: 230,
  upsertedCount: 0
}

db.itemDetailCleaned.updateMany(
    { 年份: "022-" },
    [
        {
            $set: {
                年份: '2022'
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 81,
  modifiedCount: 81,
  upsertedCount: 0
}

db.itemDetailCleaned.updateMany(
    { 年份: { $in: ["s202", "S201"] } },
    [
        {
            $set: {
                年份: { $substr: ["$立项时间", 1, 4] }
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 139,
  modifiedCount: 139,
  upsertedCount: 0
}

```

对于“年份”字段不是（“20”开头的）和（长度为4）的，能否都尝试在“立项时间”字段上截取前4位？

```js
db.itemDetailCleaned.updateMany(
    {
        $expr: {
            $or: [
                { $not: { $regexMatch: { input: "$年份", regex: /^20/ } } },
                { $ne: [ { $strLenCP: "$年份" }, 4 ] }
            ]
        }
    },
    [
        {
            $set: {
                年份: { $substr: ["$立项时间", 0, 4] }
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 1116,
  modifiedCount: 727,
  upsertedCount: 0
}

db.itemDetailCleaned.updateMany(
    { 年份: "2002" },
    [
        {
            $set: {
                年份: '2022'
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 2,
  modifiedCount: 2,
  upsertedCount: 0
}

db.itemDetailCleaned.updateMany(
    { 年份: "2014" },
    [
        {
            $set: {
                年份: '2017'
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 3,
  modifiedCount: 3,
  upsertedCount: 0
}

```

itemList collection中类似这样的文档，我需要对所有字符串类型的值进行trim，请问应该如何操作？

```json
{
  "number": "244733",
  "code": "201712574004",
  "title": "互联网+大学城闲散物流资源跨界整合创新实践",
  "members": [
    "欧泳均",
    "江惠芯  ",
    "郭桂敏"
  ],
  "level": "国家级",
  "teachers": [
    "黄金万",
    "张晓芹",
    "张义先"
  ],
  "school": "广东东软学院"
}
```

```js
db.itemList.find().forEach(function(doc) {
    var updateDoc = {};

    for (var key in doc) {
        if (typeof doc[key] === 'string') {
            updateDoc[key] = doc[key].trim();
        } else if (Array.isArray(doc[key])) {
            updateDoc[key] = doc[key].map(function(item) {
                return typeof item === 'string' ? item.trim() : item;
            });
        } else {
            updateDoc[key] = doc[key];
        }
    }

    db.itemList.updateOne({ _id: doc._id }, { $set: updateDoc });
});

```

```js
db.itemList.aggregate([
    {
        $addFields: {
            // year: { $substr: ["$number", 0, 4] }
            // number前四位不一定是年份，
            // 如果开头不是20，则说明[1, 5]是年份
            // 我应该如何修改？
            year: {
                $cond: {
                    if: { $not: { $regexMatch: { input: { $substr: ["$number", 0, 2] }, regex: /^20/ } } },
                    then: { $substr: ["$number", 1, 4] },
                    else: { $substr: ["$number", 0, 4] }
                }
            }
        }
    },
    {
        $merge: {
            into: "itemList",
            on: "_id",
            whenMatched: "replace"
        }
    }
]);

db.itemList.updateMany(
    { },
    [
        {
            $set: {
                year: {
                  $cond: {
                      if: { $not: { $regexMatch: { input: { $substr: ["$code", 0, 2] }, regex: /^20/ } } },
                      then: { $substr: ["$code", 1, 4] },
                      else: { $substr: ["$code", 0, 4] }
                  }
                }
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 247965,
  modifiedCount: 247867,
  upsertedCount: 0
}
```

我不小心在 itemDetailCleaned 的所有文档中都创建了一个year字段，请问如何删除？

```js
db.itemDetailCleaned.updateMany(
    {}, // 匹配所有文档
    {
        $unset: {
            year: "" // 删除year字段
        }
    }
);


{
  acknowledged: true,
  insertedId: null,
  matchedCount: 247965,
  modifiedCount: 247965,
  upsertedCount: 0
}
```

```js
db.itemList.aggregate([
    {
        $group: {
            _id: "$year",
            count: { $sum: 1 }
        }
    },
    {
        $sort: {
            count: -1
        }
    },
    {
        $limit: 10
    }
])

db.itemList.updateMany(
    { year: "0384" },
    [
        {
            $set: {
                year: '2017'
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 230,
  modifiedCount: 230,
  upsertedCount: 0
}

db.itemList.updateMany(
    { year: "0724" },
    [
        {
            $set: {
                year: '2022'
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 53,
  modifiedCount: 53,
  upsertedCount: 0
}

db.itemList.updateMany(
    { year: "X202" },
    [
        {
            $set: {
                year: '2020'
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 21,
  modifiedCount: 21,
  upsertedCount: 0
}

db.itemList.updateMany(
    { year: "4038" },
    [
        {
            $set: {
                year: '2019'
            }
        }
    ]
);

{
  acknowledged: true,
  insertedId: null,
  matchedCount: 19,
  modifiedCount: 19,
  upsertedCount: 0
}

db.itemList.updateMany(
    { year: "0741" },
    [
        {
            $set: {
                year: '2023'
            }
        }
    ]
);

db.itemList.updateMany(
    { year: "0073" },
    [
        {
            $set: {
                year: '2017'
            }
        }
    ]
);

db.itemList.updateMany(
    { year: "ysj2" },
    [
        {
            $set: {
                year: '2020'
            }
        }
    ]
);
```

在 itemList collection 中，我希望更新year字符串字段开头不是“20”的值。更新方法是 itemDetailCleaned collection 中用 number 字段找到对应的文档，使用 itemDetailCleaned 的“年份”字段的值更新 itemList 的 year 字段。应该如何操作？

```js
db.itemList.aggregate([
    {
        $match: {
            year: { $not: /^20/ } // 匹配year字段开头不是“20”的文档
        }
    },
    {
        $lookup: {
            from: "itemDetailCleaned", // 联结itemDetailCleaned集合
            localField: "number", // itemList中的字段
            foreignField: "number", // itemDetailCleaned中的字段
            as: "detail" // 结果存储在detail字段
        }
    },
    {
        $set: {
            year: { // 使用itemDetailCleaned的“年份”字段更新year
                $arrayElemAt: ["$detail.年份", 0] // 取第一个匹配的文档的年份
            }
        }
    },
    {
        $unset: "detail" // 删除临时detail字段
    },
    {
        $merge: {
            into: "itemList", // 更新itemList集合
            on: "_id",
            whenMatched: "replace" // 替换匹配的文档
        }
    }
]);

```
