import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://odegxbqmmiqkyvvaajez.supabase.co'
// Replace with the anon key provided by the user later
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZWd4YnFtbWlxa3l2dmFhamV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTgwNDAsImV4cCI6MjA5MDA3NDA0MH0.mip26fWLxvhUoT7ePA5RNIzOmmV38WXUnQDBpckNtt8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
