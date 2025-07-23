import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCard } from '@/components/timeline';
import { 
  TrendingUp, 
  Hash, 
  Users, 
  Flame, 
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';

interface TrendingTopic {
  id: string;
  tag: string;
  posts: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
}

interface PopularPost {
  id: string;
  content: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    reposts: number;
    views: number;
  };
  createdAt: string;
}

interface SuggestedUser {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  verified?: boolean;
  stats: {
    following: number;
    followers: number;
    posts: number;
    likes: number;
  };
  isFollowing?: boolean;
  joinedAt: string;
  mutualFollowers?: number;
}

interface SidebarProps {
  className?: string;
  onUserClick?: (username: string) => void;
  onTopicClick?: (topic: string) => void;
}

// Mock data
const mockTrendingTopics: TrendingTopic[] = [
  { id: '1', tag: 'AI', posts: 12500, trend: 'up', category: 'Technology' },
  { id: '2', tag: 'React', posts: 8900, trend: 'up', category: 'Development' },
  { id: '3', tag: 'TypeScript', posts: 6700, trend: 'stable', category: 'Development' },
  { id: '4', tag: 'WebDev', posts: 15200, trend: 'up', category: 'Development' },
  { id: '5', tag: 'OpenSource', posts: 4300, trend: 'down', category: 'Development' },
];

const mockPopularPosts: PopularPost[] = [
  {
    id: '1',
    content: 'Just launched my new VS Code extension! It uses AI to help with code refactoring. Check it out! 🚀',
    author: {
      name: 'Alex Chen',
      username: 'alexdev',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      verified: true
    },
    stats: { likes: 234, comments: 45, reposts: 67, views: 12500 },
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    content: 'Hot take: TypeScript has fundamentally changed how I think about JavaScript development. The type safety is a game changer.',
    author: {
      name: 'Sarah Johnson',
      username: 'sarahcodes',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150'
    },
    stats: { likes: 189, comments: 78, reposts: 23, views: 8900 },
    createdAt: '2024-01-14T15:20:00Z'
  }
];

const mockSuggestedUsers: SuggestedUser[] = [
  {
    id: 1,
    name: 'Emma Wilson',
    username: 'emmawilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    bio: 'Frontend Engineer at @company. React enthusiast. Coffee lover.',
    verified: false,
    stats: { following: 89, followers: 1234, posts: 456, likes: 2890 },
    joinedAt: '2023-03-15T00:00:00Z',
    mutualFollowers: 5
  },
  {
    id: 2,
    name: 'Marcus Chen',
    username: 'marcusc',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Full-stack developer. Building the future of web development.',
    verified: true,
    stats: { following: 234, followers: 3456, posts: 789, likes: 12300 },
    joinedAt: '2022-08-20T00:00:00Z',
    mutualFollowers: 12
  }
];

export default function Sidebar({ className = '', onUserClick, onTopicClick }: SidebarProps) {
  const [trending, setTrending] = useState(mockTrendingTopics);
  const [popular, setPopular] = useState(mockPopularPosts);
  const [suggested, setSuggested] = useState(mockSuggestedUsers);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch real data from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className={`w-80 border-l border-border/50 bg-background/50 backdrop-blur-sm ${className}`}>
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Discover</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="p-4 space-y-6">
          {/* Trending Topics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trending.slice(0, 5).map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onTopicClick?.(topic.tag)}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">#{topic.tag}</div>
                      <div className="text-xs text-muted-foreground">
                        {topic.posts.toLocaleString()} posts
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(topic.trend)}
                    <Badge variant="secondary" className="text-xs">
                      {topic.category}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Show more
              </Button>
            </CardContent>
          </Card>

          {/* Suggested Users */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Who to follow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggested.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  compact
                  onUserClick={onUserClick}
                />
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Show more
              </Button>
            </CardContent>
          </Card>

          {/* Popular Posts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" />
                Popular this week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {popular.map((post) => (
                <div
                  key={post.id}
                  className="p-3 rounded-lg border border-border/30 hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="h-6 w-6 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-xs">{post.author.name}</span>
                        {post.author.verified && (
                          <div className="h-3 w-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">@{post.author.username}</span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-3">{post.content}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{post.stats.likes} likes</span>
                    <span>{post.stats.comments} comments</span>
                    <span>{post.stats.views} views</span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all popular
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
