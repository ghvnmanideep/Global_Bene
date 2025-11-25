# import os
# from pymongo import MongoClient
# from dotenv import load_dotenv

# load_dotenv()

# def investigate_databases():
#     """Check all databases and collections in your cluster"""
    
#     MONGO_URI = os.environ.get("MONGO_URI")
#     print(f" Connecting to: {MONGO_URI[:50]}...")
#    
#     try:
#         client = MongoClient(MONGO_URI)
        
#         # List ALL databases in the cluster
#         database_names = client.list_database_names()
#         print(f" All databases in cluster: {database_names}")
        
#         # Check each database for collections
#         for db_name in database_names:
#             db = client[db_name]
#             collections = db.list_collection_names()
#             print(f"    Database '{db_name}' has collections: {collections}")
            
#             # Show sample data from each collection
#             for collection_name in collections:
#                 sample_doc = db[collection_name].find_one()
#                 print(f"       Sample from '{collection_name}': {sample_doc}")
        
#         client.close()
        
#     except Exception as e:
#         print(f" Error: {e}")

# def check_connection_details():
#     """Check what we're actually connecting to"""
    
#     MONGO_URI = os.environ.get("MONGO_URI")
    
#     try:
#         client = MongoClient(MONGO_URI)
        
#         # Get cluster information
#         admin_db = client.admin
#         server_info = admin_db.command('ismaster')
#         print(f" Connected to cluster: {server_info.get('me', 'Unknown')}")
        
#         # Alternative: Try to get database stats for gncipl_bene
#         db = client['gncipl_bene']
#         try:
#             stats = db.command('dbStats')
#             print(f" Database 'gncipl_bene' stats:")
#             print(f"   - Collections: {stats.get('collections', 0)}")
#             print(f"   - Objects: {stats.get('objects', 0)}")
#             print(f"   - Data size: {stats.get('dataSize', 0)} bytes")
#         except Exception as e:
#             print(f"❀ Could not get stats for 'gncipl_bene': {e}")
        
#         client.close()
        
#     except Exception as e:
#         print(f" Error: {e}")

# print(" INVESTIGATING DATABASES...")
# investigate_databases()

# print("\n" + "="*50)
# print("CHECKING CONNECTION DETAILS...")
# print("="*50)
# check_connection_details()


# -----above one is working fine - it will show all dbs and collections and sample data----- #

# import os
# from pymongo import MongoClient
# import pandas as pd
# from dotenv import load_dotenv

# load_dotenv()

# def quick_extract():
#     # Connection - CORRECTED DATABASE NAME
#     client = MongoClient(os.environ.get("MONGO_URI"))
#     db = client['global_bene']  # Changed from 'gncipl_bene' to 'global_bene'
    
#     # Get all data from collections
#     users = list(db.users.find())
#     posts = list(db.posts.find())
    
#     print(f" Fetched {len(users)} users and {len(posts)} posts")
    
#     # Convert to DataFrames
#     users_df = pd.DataFrame(users)
#     posts_df = pd.DataFrame(posts)
    
#     # Handle ObjectId
#     if not users_df.empty:
#         users_df['_id'] = users_df['_id'].astype(str)
#     if not posts_df.empty:
#         posts_df['_id'] = posts_df['_id'].astype(str)
    
#     return users_df, posts_df, users, posts

# # Run it
# users_df, posts_df, users, posts = quick_extract()

# print(f" Users DataFrame: {users_df.shape}")
# print(f" Posts DataFrame: {posts_df.shape}")
# print(f" Raw users list: {len(users)} documents")
# print(f" Raw posts list: {len(posts)} documents")

# # Display first few rows
# if not users_df.empty:
#     print("\nFirst 2 users:")
#     print(users_df.head(2))
    
# if not posts_df.empty:
#     print("\nFirst 2 posts:")
#     print(posts_df.head(2))
    


# ! ===> _id => ObjectId(...) needs to be converted to string for DataFrame display
        # users_df['_id'] = users_df['_id'].astype(str)

# ? ===> user_id, post_id, author_id, etc. may also need conversion depending on usage
# *users_df['_id'] = users_df['_id'].astype(str) -- user_id = _id
# *posts_df['_id'] = posts_df['_id'].astype(str) -- post_id = _id


# **  users_df = pd.DataFrame(users).rename(columns={'_id': 'user_id'})
# **  posts_df = pd.DataFrame(posts).rename(columns={'_id': 'post_id'})



# **or-
    
    # Get data
    # users = list(db.users.find())
    # posts = list(db.posts.find())
    
    # Convert to DataFrames first
    # users_df = pd.DataFrame(users)
    # posts_df = pd.DataFrame(posts)
    
    # # Rename _id columns
    # users_df = users_df.rename(columns={'_id': 'user_id'})
    # posts_df = posts_df.rename(columns={'_id': 'post_id'})
    
    # # Convert ObjectId to string
    # users_df['user_id'] = users_df['user_id'].astype(str)
    # posts_df['post_id'] = posts_df['post_id'].astype(str)
    
    
    
    
    
    
# ********************
# def extract_all_collections():
#     client = MongoClient(os.environ.get("MONGO_URI"))
#     db = client['global_bene']
    
#     # Extract all collections with proper ID naming
#     users_df = pd.DataFrame(list(db.users.find())).rename(columns={'_id': 'user_id'})
#     posts_df = pd.DataFrame(list(db.posts.find())).rename(columns={'_id': 'post_id'})
#     comments_df = pd.DataFrame(list(db.comments.find())).rename(columns={'_id': 'comment_id'})
#     communities_df = pd.DataFrame(list(db.communities.find())).rename(columns={'_id': 'community_id'})
#     activitylogs_df = pd.DataFrame(list(db.activitylogs.find())).rename(columns={'_id': 'log_id'})
#     notifications_df = pd.DataFrame(list(db.notifications.find())).rename(columns={'_id': 'notification_id'})
    
#     # Convert all ID columns to string
#     id_columns = {
#         'users_df': 'user_id',
#         'posts_df': 'post_id', 
#         'comments_df': 'comment_id',
#         'communities_df': 'community_id',
#         'activitylogs_df': 'log_id',
#         'notifications_df': 'notification_id'
#     }
    
#     for df_name, id_col in id_columns.items():
#         if df_name in locals():
#             df = locals()[df_name]
#             if not df.empty and id_col in df.columns:
#                 df[id_col] = df[id_col].astype(str)
    
#     return users_df, posts_df, comments_df, communities_df, activitylogs_df, notifications_df

# # Usage
# users_df, posts_df, comments_df, communities_df, activitylogs_df, notifications_df = extract_all_collections()
# ***************************