# YouTube Companion Dashboard

A comprehensive YouTube video management dashboard that helps content creators manage their videos, comments, and notes through a beautiful, modern interface.

## Features

- **Video Details Display**: Fetch and display detailed information about YouTube videos including views, likes, comments, and descriptions
- **Comment Management**: View, add, and delete comments on your videos with reply functionality
- **Video Editing**: Update video titles and descriptions directly from the dashboard
- **Personal Notes**: Add, edit, and delete private notes for video improvement ideas
- **Event Logging**: Comprehensive logging of all user actions for analytics and tracking
- **Modern UI**: Dark theme with YouTube-inspired design and smooth animations

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database + Authentication + Edge Functions)
- **APIs**: YouTube Data API v3
- **Icons**: Lucide React
- **Build Tool**: Vite

## Database Schema

### Tables

#### `notes`
```sql
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `event_logs`
```sql
CREATE TABLE event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Authenticated users only

## API Endpoints

All API endpoints are implemented as Supabase Edge Functions:

### YouTube API Proxy (`/functions/v1/youtube-api`)

#### GET Video Details
```
GET /functions/v1/youtube-api?action=video-details&videoId={videoId}
```

#### GET Comments
```
GET /functions/v1/youtube-api?action=comments&videoId={videoId}
```

#### POST Comment
```
POST /functions/v1/youtube-api?action=post-comment&videoId={videoId}
Body: { accessToken: string, text: string }
```

#### DELETE Comment
```
DELETE /functions/v1/youtube-api?action=delete-comment&commentId={commentId}
Body: { accessToken: string }
```

#### PUT Update Video
```
PUT /functions/v1/youtube-api?action=update-video&videoId={videoId}
Body: { accessToken: string, title: string, description: string }
```

### Database Operations (Supabase Client)

#### Notes
- `GET /rest/v1/notes` - Fetch user notes for a video
- `POST /rest/v1/notes` - Create new note
- `PATCH /rest/v1/notes` - Update existing note
- `DELETE /rest/v1/notes` - Delete note

#### Event Logs
- `POST /rest/v1/event_logs` - Log user events

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
YOUTUBE_API_KEY=your_youtube_api_key
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd youtube-companion-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration in `supabase/migrations/create_tables.sql`
   - Enable Google OAuth in Authentication settings
   - Deploy the edge function in `supabase/functions/youtube-api/`

4. **Configure YouTube API**
   - Create a project in Google Cloud Console
   - Enable YouTube Data API v3
   - Create credentials (API Key)
   - Add API key to Supabase edge function environment

5. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase and YouTube API credentials

6. **Run the development server**
   ```bash
   npm run dev
   ```

## Usage

1. **Authentication**: Sign in with Google to get YouTube OAuth permissions
2. **Video Management**: Enter a YouTube video ID to start managing your video
3. **Comments**: View and manage comments (requires OAuth permissions)
4. **Video Editing**: Update titles and descriptions (requires OAuth permissions)
5. **Notes**: Add personal notes for video improvement ideas

## Important Notes

- **OAuth Requirements**: Comment posting/deletion and video editing require YouTube OAuth authentication with appropriate scopes
- **Video Ownership**: You can only edit videos that you own
- **Rate Limits**: YouTube API has rate limits - use responsibly
- **Privacy**: All notes are private and only visible to the authenticated user

## Event Logging

The application logs various user actions including:
- Dashboard views
- Video details fetching
- Comment interactions
- Video editing attempts
- Note management
- Authentication events

## Deployment

The application can be deployed to platforms like:
- Netlify
- Vercel
- Cloudflare Pages

Supabase handles the backend infrastructure including:
- Database hosting
- Authentication
- Edge Functions (API proxy)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

GGuM7DMzq9I - yt id