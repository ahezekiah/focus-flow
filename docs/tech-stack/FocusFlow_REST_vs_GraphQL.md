# Focus Flow: REST API vs. GraphQL

## Project Overview

**Focus Flow** is a productivity web application designed to help students and professionals complete meaningful work without switching between multiple tools. The application combines focus sessions, task management, projects, themed environments, music, ambient sounds, streaks, analytics, and an accountability network in one workspace.

The current repository contains a React, TypeScript, Vite, and Tailwind CSS prototype. The planned full-stack version uses Next.js API routes, PostgreSQL, Prisma, Clerk, Recharts, and the HTML5 Audio API.

As Focus Flow grows, the frontend will need an API to communicate with the database. Two possible approaches are **REST API** and **GraphQL**.

---

## What Is a REST API?

REST is an API style that separates application data into different URL endpoints. Each endpoint normally represents one resource, such as users, tasks, sessions, playlists, or streaks.

### Example REST Endpoints for Focus Flow

```text
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId

GET    /api/sessions
POST   /api/sessions
PATCH  /api/sessions/:sessionId/complete

GET    /api/users/:userId/streak
GET    /api/themes
GET    /api/playlists
```

---

## REST API Pros

- **Easy to understand:** Each URL has a clear purpose, such as retrieving tasks or creating a session.
- **Works naturally with HTTP:** REST uses familiar methods including `GET`, `POST`, `PATCH`, and `DELETE`.
- **Simple to build with Next.js:** Focus Flow can create each endpoint with Next.js route handlers.
- **Good for CRUD features:** Tasks, projects, sessions, playlists, and themes can be created, read, updated, and deleted through predictable routes.
- **Easy to test:** Individual endpoints can be tested with tools such as Postman or Insomnia.
- **Supports standard HTTP caching:** Public resources, such as default themes and playlists, can be cached efficiently.
- **Useful for real-time features:** REST API's subscriptions could support live accountability updates or session activity.

---

## REST API Cons

- **May require multiple requests:** The dashboard may need separate requests for the user, tasks, sessions, streaks, and recommendations.
- **Can over-fetch data:** An endpoint may return fields that a specific page does not need.
- **Can under-fetch data:** One response may not contain enough connected information, forcing the frontend to make another request.
- **More endpoints to maintain:** As Focus Flow gains features, the backend could contain many routes.
- **Frontend changes may require new endpoints:** A new dashboard design may need a special endpoint that combines several resources.
- **Lambdas:** Is a bit of a learning curve in a short time frame.
- **AWS API Gateway:** Have to expose the Lambda to REST API endpoint.

---

## Focus Flow REST Example: Loading the Dashboard

The Focus Flow dashboard may display:

- The current user's name
- Today's tasks
- The active streak
- Recently completed sessions
- The user's selected theme
- A recommended playlist

Using REST, the frontend might make several requests:

```javascript
const userResponse = await fetch("/api/users/me");
const tasksResponse = await fetch("/api/tasks?status=incomplete");
const streakResponse = await fetch("/api/streaks/current");
const sessionsResponse = await fetch("/api/sessions?limit=5");
const themeResponse = await fetch("/api/themes/selected");
const playlistResponse = await fetch("/api/playlists/recommended");
```

### Why REST Is Helpful Here

Each feature remains separate and easy to debug. If the task list is not loading, the development team can inspect `/api/tasks` without searching through one large request.

### Possible Problem

The dashboard must wait for several network requests. This can add loading states and make the frontend logic more complicated.

---

## Focus Flow REST Example: Creating a Focus Session

A user can configure a session by selecting a duration, objective, project, task, theme, and playlist.

```javascript
const response = await fetch("/api/sessions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    durationMinutes: 45,
    objective: "Coding",
    projectId: "project_12",
    taskId: "task_42",
    themeId: "theme_rainy_evening",
    playlistId: "playlist_deep_focus",
  }),
});
```

A possible REST response could be:

```json
{
  "id": "session_101",
  "durationMinutes": 45,
  "objective": "Coding",
  "status": "READY",
  "taskId": "task_42",
  "themeId": "theme_rainy_evening",
  "playlistId": "playlist_deep_focus"
}
```

This is a strong use case for REST because creating one session is a clear and focused operation.

---

## What Is GraphQL?

GraphQL is an API query language that normally uses one endpoint, such as `/api/graphql`. The frontend describes the exact fields it needs, and the backend returns only those fields.

Instead of requesting several REST endpoints, Focus Flow could request connected dashboard data with one GraphQL query.

---

## GraphQL Pros

- **Retrieves connected data in one request from the frontend:** Tasks, sessions, streaks, themes, and playlists can be requested together.
- **Returns only requested fields:** The frontend controls the shape of the response.
- **Reduces over-fetching and under-fetching:** Pages receive the exact information they need.
- **Strongly typed schema:** Developers can clearly see which queries, mutations, fields, and data types are available.
- **Helpful developer tools:** GraphQL tools provide documentation, autocomplete, and query testing.
- **Flexible for different pages:** A desktop dashboard and mobile layout can request different fields from the same API.
- **Useful for real-time features:** GraphQL subscriptions could support live accountability updates or session activity.

---

## GraphQL Cons

- **More setup and learning:** The team must understand schemas, resolvers, queries, mutations, and possibly subscriptions.
- **Caching is less automatic:** GraphQL does not use URL-based HTTP caching as naturally as REST.
- **Complex queries can affect performance:** Clients may request deeply nested or expensive data without proper limits.
- **Authorization can be more detailed:** Permissions may need to be checked across several fields and resolvers.
- **Errors are handled differently:** A GraphQL response can contain both partial data and errors, which may initially be confusing.
- **May be unnecessary for a small MVP:** If Focus Flow only has a few straightforward screens, REST may be faster to implement during an eight-week project.

---

## Focus Flow GraphQL Example: Loading the Dashboard

With GraphQL, the dashboard could request all required information through one endpoint:

```graphql
query GetFocusDashboard {
  currentUser {
    id
    firstName
    currentStreak
    longestStreak
    selectedTheme {
      id
      name
      backgroundImage
    }
    recommendedPlaylist {
      id
      name
      coverImage
    }
    tasks(status: INCOMPLETE, limit: 5) {
      id
      title
      completed
      project {
        id
        name
      }
    }
    recentSessions(limit: 5) {
      id
      objective
      durationMinutes
      completedAt
    }
  }
}
```

The response could contain only the requested fields:

```json
{
  "data": {
    "currentUser": {
      "id": "user_1",
      "firstName": "Amanda",
      "currentStreak": 7,
      "longestStreak": 14,
      "selectedTheme": {
        "id": "theme_rainy_evening",
        "name": "Rainy Evening",
        "backgroundImage": "/themes/rainy-evening.jpg"
      },
      "recommendedPlaylist": {
        "id": "playlist_deep_focus",
        "name": "Deep Focus",
        "coverImage": "/playlists/deep-focus.jpg"
      },
      "tasks": [
        {
          "id": "task_42",
          "title": "Build session timer",
          "completed": false,
          "project": {
            "id": "project_12",
            "name": "Focus Flow"
          }
        }
      ],
      "recentSessions": [
        {
          "id": "session_100",
          "objective": "Coding",
          "durationMinutes": 45,
          "completedAt": "2026-07-29T17:30:00.000Z"
        }
      ]
    }
  }
}
```

### Why GraphQL Is Helpful Here

The dashboard gets related data in one request. The frontend does not need to combine six separate responses, and it only receives the fields currently displayed.

---

## Focus Flow GraphQL Example: Starting a Session

GraphQL uses a **mutation** when data is created or changed.

```graphql
mutation StartFocusSession($input: StartSessionInput!) {
  startSession(input: $input) {
    id
    status
    startedAt
    durationMinutes
    objective
    task {
      id
      title
    }
    theme {
      id
      name
    }
    playlist {
      id
      name
    }
  }
}
```

Variables sent with the mutation:

```json
{
  "input": {
    "durationMinutes": 45,
    "objective": "Coding",
    "projectId": "project_12",
    "taskId": "task_42",
    "themeId": "theme_rainy_evening",
    "playlistId": "playlist_deep_focus"
  }
}
```

The mutation can create the session and immediately return the task, theme, and playlist information needed by the focus screen.

---

## Focus Flow GraphQL Example: Completing a Session and Updating a Streak

When a user completes a daily session, Focus Flow needs to update the session, task progress, analytics, and possibly the user's streak.

```graphql
mutation CompleteSession($sessionId: ID!) {
  completeSession(sessionId: $sessionId) {
    session {
      id
      status
      completedAt
      durationMinutes
    }
    task {
      id
      title
      completed
    }
    streak {
      current
      longest
      increased
    }
    dailyProgress {
      completedMinutes
      goalMinutes
      percentage
    }
  }
}
```

This allows one action to return every updated value the completion screen needs.

With REST, the same flow might require:

```text
PATCH /api/sessions/:sessionId/complete
PATCH /api/tasks/:taskId
GET   /api/streaks/current
GET   /api/analytics/daily
```

The REST backend could also create one specialized completion endpoint, but GraphQL allows the frontend to choose which updated fields it wants returned.

---

## Focus Flow GraphQL Example: Accountability Network

Focus Flow plans to let group members report progress and congratulate each other. GraphQL could query a group activity feed like this:

```graphql
query GetAccountabilityGroup($groupId: ID!) {
  accountabilityGroup(id: $groupId) {
    id
    name
    members {
      id
      displayName
      currentStreak
    }
    activityFeed(limit: 20) {
      id
      type
      createdAt
      user {
        id
        displayName
      }
      session {
        objective
        durationMinutes
      }
      congratulationsCount
      congratulatedByCurrentUser
    }
  }
}
```

A mutation could allow the current user to congratulate a group member:

```graphql
mutation CongratulateUser($activityId: ID!) {
  congratulateActivity(activityId: $activityId) {
    id
    congratulationsCount
    congratulatedByCurrentUser
  }
}
```

This is where GraphQL becomes especially useful because users, groups, sessions, streaks, and reactions are highly connected.

---

## REST vs. GraphQL Comparison for Focus Flow

| Category | REST API | GraphQL |
|---|---|---|
| Endpoint structure | Multiple resource endpoints | Usually one endpoint |
| Learning curve | Lower | Higher |
| Simple task CRUD | Excellent | Good |
| Creating a focus session | Excellent | Excellent |
| Complex dashboard data | May require several requests | Can use one query |
| Returning exact fields | Server controls response | Client controls response |
| HTTP caching | Straightforward | Requires more planning |
| Connected accountability data | Can require nested or custom endpoints | Strong fit |
| Real-time group activity | Requires WebSockets or SSE separately | Can use subscriptions |
| MVP development speed | Usually faster | More initial setup |
| Long-term frontend flexibility | Moderate | High |

---

## When REST Would Be Best for Focus Flow

REST would be a strong choice when:

- The team needs to complete an MVP within a short development period.
- Most features use straightforward CRUD operations.
- Each page only needs one or two resources.
- The developers are already comfortable with Next.js API routes.
- The project needs simple debugging and predictable backend routes.

Examples include:

- Creating, editing, completing, and deleting tasks
- Starting or canceling a focus session
- Retrieving the list of available themes
- Retrieving playlists and ambient sounds
- Updating a user's settings

---

## When GraphQL Would Be Best for Focus Flow

GraphQL would be especially helpful when:

- The dashboard combines many related resources.
- The accountability feed connects users, groups, sessions, streaks, and reactions.
- Different screens require different subsets of the same data.
- The app expands to mobile or other clients.
- The team adds live session status or group notifications.
- The frontend changes frequently and needs flexible data retrieval.

Examples include:

- Loading the personalized dashboard in one request
- Displaying a project with its tasks and completed sessions
- Returning all updates after a focus session is completed
- Loading accountability-group activity and user reactions
- Building detailed productivity analytics

---

## Recommended Approach for Focus Flow

For the first Focus Flow MVP, **REST is likely the most practical choice**. The planned Next.js API routes already support it naturally, and many early features—such as task management, session creation, themes, playlists, and settings—are standard CRUD operations.

As the application grows, **GraphQL may become more valuable** for the dashboard, analytics, and accountability network because these screens combine several connected types of data. A future version could migrate fully to GraphQL or use a hybrid approach in which REST handles simple operations while GraphQL handles complex, data-heavy screens.

---

## Final Summary

REST is simpler, easier to debug, and faster to implement for Focus Flow's first version. GraphQL requires more setup, but it can reduce API requests and give the frontend more flexibility when retrieving connected information such as users, tasks, sessions, streaks, themes, playlists, analytics, and accountability activity.
