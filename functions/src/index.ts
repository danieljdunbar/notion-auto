import * as functions from 'firebase-functions';
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

const notion = new Client({ auth: functions.config().notionapi.key });
dotenv.config();

// TODO: Figure out how to put new entry at the top of the page
export const notionDailyGoalsOnce = functions.https.onRequest(
  async (req, res) => {
    // get definition for the database to be created
    const newDailyGoalsTable = generateNewDailyGoalsSchema(
      functions.config().notionapi.dailygoalspage
    );

    const newTableInfo = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + functions.config().notionapi.key,
        'Content-Type': 'application/json',
        'Notion-Version': '2021-08-16',
      },
      body: JSON.stringify(newDailyGoalsTable),
    })
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        functions.logger.info('DAILY GOALS TABLE', json);
        return json;
      });

    await addDailyGoalsToTable(
      (newTableInfo as any).id,
      (newTableInfo as any).properties
    );

    res.send('Daily goals table created!');
  }
);

async function addDailyGoalsToTable(id: string, properties: any) {
  const goals = [
    'Keeps',
    'Dishes',
    'Spanish',
    'Journal',
    'Song writing',
    'AI',
    'Meditation',
    'Stretch',
    'Sing',
    'Program',
    'Workout',
  ];

  for (const goal of goals) {
    await notion.pages.create({
      parent: {
        database_id: id,
      },
      properties: {
        Name: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: goal,
              },
            },
          ],
        },
        Status: {
          type: 'select',
          select: properties.Status.select.options[0],
        },
      },
    });
  }
}

function generateNewDailyGoalsSchema(pageId: string) {
  return {
    parent: {
      type: 'page_id',
      page_id: pageId,
    },
    title: [
      {
        type: 'text',
        text: {
          content: '@' + getCurrentDate(),
          link: null,
        },
      },
    ],
    properties: {
      Name: {
        title: {},
      },
      Status: {
        select: {
          options: [
            {
              name: 'Not started',
              color: 'red',
            },
            {
              name: 'In progress',
              color: 'yellow',
            },
            {
              name: 'Completed',
              color: 'green',
            },
          ],
        },
      },
      Completed: {
        formula: { expression: 'prop("Status") == "Completed"' },
      },
    },
  };
}

function getCurrentDate() {
  const date_ob = new Date();
  const date = ('0' + date_ob.getDate()).slice(-2);
  const month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
  const year = date_ob.getFullYear();
  return month + '/' + date + '/' + year;
}

// exports.notionDailyChanges = functions.pubsub
//   .schedule('every 5 minutes')
//   .onRun(async (context) => {
//     // Add new daily goals table
//     const response = await fetch('https://api.notion.com/v1/databases', {
//       method: 'POST',
//       headers: {
//         Authorization: 'Bearer ' + process.env.NOTION_INTEGRATION_TOKEN,
//         'Content-Type': 'application/json',
//       },
//     });

//     // Add daily goal entries to new table

//     // Change the home table to reference the new daily goals

//     console.log('This will be run every 1 minutes!');
//     return null;
//   });
