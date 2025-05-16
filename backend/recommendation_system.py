import os
import numpy as np
import pandas as pd
import logging
import json
import ast
from pathlib import Path
from math import sqrt
from sklearn.linear_model import Ridge
from sklearn.feature_extraction.text import TfidfTransformer

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join('backend', 'app.log'), encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('recommendation_system')

class RecommendationSystem:

    def __init__(self, data_folder='backend/data/dataset'):

        self.data_folder = data_folder
        self.movies = None
        self.ratings = None
        self.users = None
        self.item_features = None
        self.item_tfidf = None  # Ma trận TF-IDF của các đặc trưng phim
        self.user_ratings_matrix = None
        self.user_weights = None  # Ma trận trọng số của người dùng
        self.user_bias = None  # Vector bias của người dùng
        
        # Tạo thư mục dữ liệu nếu chưa tồn tại
        os.makedirs(data_folder, exist_ok=True)
        
        # Tải dữ liệu
        self._load_data()
        
        logger.info("Hệ thống đề xuất đã được khởi tạo thành công")
    
    def _ensure_sample_data(self):
        """
        Đảm bảo có dữ liệu mẫu để sử dụng cho hệ thống đề xuất
        """
        # Các bộ phim mẫu với thể loại và mô tả
        sample_movies = [
            {
                "Id": 1, 
                "Title": "The Matrix", 
                "Genres": "['Action', 'Sci-Fi', 'Cyberpunk']", 
                "Vote Average": 8.7,
                "Overview": "Một lập trình viên khám phá ra sự thật rằng thực tại là một mô phỏng và tham gia vào cuộc chiến chống lại máy móc kiểm soát."
            },
            {
                "Id": 2, 
                "Title": "Inception", 
                "Genres": "['Action', 'Sci-Fi', 'Thriller']", 
                "Vote Average": 8.8,
                "Overview": "Một tên trộm có khả năng đánh cắp bí mật từ giấc mơ của người khác được giao nhiệm vụ trồng một ý tưởng vào tâm trí của một CEO."
            },
            {
                "Id": 3, 
                "Title": "The Shawshank Redemption", 
                "Genres": "['Drama', 'Crime']", 
                "Vote Average": 9.3,
                "Overview": "Câu chuyện về Andy Dufresne, một nhân viên ngân hàng bị kết án oan sai và tình bạn của anh với Red trong nhà tù Shawshank."
            },
            {
                "Id": 4, 
                "Title": "Pulp Fiction", 
                "Genres": "['Crime', 'Drama', 'Dark Comedy']", 
                "Vote Average": 8.9,
                "Overview": "Các câu chuyện đan xen về tội phạm ở Los Angeles, bao gồm hai sát thủ, một võ sĩ quyền anh, vợ của một ông trùm và một cặp cướp nhà hàng."
            },
            {
                "Id": 5, 
                "Title": "The Dark Knight", 
                "Genres": "['Action', 'Crime', 'Superhero']", 
                "Vote Average": 9.0,
                "Overview": "Batman phải đối mặt với kẻ thù nguy hiểm nhất của mình: Joker, một tên tội phạm điên loạn đe dọa phá hủy Gotham City."
            },
            {
                "Id": 6, 
                "Title": "Forrest Gump", 
                "Genres": "['Drama', 'Comedy', 'Romance']", 
                "Vote Average": 8.8,
                "Overview": "Cuộc đời phi thường của Forrest Gump, một người đàn ông chậm phát triển nhưng có trái tim trong sáng và tình yêu vĩnh cửu dành cho Jenny."
            },
            {
                "Id": 7, 
                "Title": "Parasite", 
                "Genres": "['Horror', 'Drama', 'Dark Comedy']", 
                "Vote Average": 8.6,
                "Overview": "Một gia đình nghèo khó dần dần thâm nhập vào cuộc sống của một gia đình giàu có, dẫn đến một chuỗi sự kiện bất ngờ và đen tối."
            },
            {
                "Id": 8, 
                "Title": "Avatar", 
                "Genres": "['Action', 'Adventure', 'Sci-Fi']", 
                "Vote Average": 7.8,
                "Overview": "Một cựu thủy quân lục chiến bị liệt tham gia chương trình Avatar trên hành tinh Pandora và phải lựa chọn giữa nhiệm vụ và bảo vệ thế giới mới."
            },
            {
                "Id": 9, 
                "Title": "Titanic", 
                "Genres": "['Drama', 'Romance', 'Disaster']", 
                "Vote Average": 7.9,
                "Overview": "Câu chuyện tình yêu bi thảm giữa Jack và Rose trên con tàu Titanic trong chuyến đi định mệnh đầu tiên và cũng là cuối cùng của nó."
            },
            {
                "Id": 10, 
                "Title": "Spirited Away", 
                "Genres": "['Animation', 'Adventure', 'Fantasy']", 
                "Vote Average": 8.6,
                "Overview": "Một cô bé 10 tuổi bước vào thế giới thần linh kỳ bí sau khi cha mẹ bị biến thành lợn, và cô phải tìm cách giải cứu họ."
            }
        ]

        # Đường dẫn đến các file dữ liệu
        movies_file = os.path.join(self.data_folder, 'Movies.csv')
        
        # Tạo và lưu file dữ liệu mẫu nếu Movies.csv không tồn tại
        if not os.path.exists(movies_file):
            logger.info("Tạo dữ liệu phim mẫu")
            movies_df = pd.DataFrame(sample_movies)
            movies_df.to_csv(movies_file, index=False)
    
    def _load_data(self):
        """
        Tải dữ liệu phim từ các file
        """
        try:
            # Tải dữ liệu phim
            movies_file = os.path.join(self.data_folder, 'Movies.csv')
            if os.path.exists(movies_file):
                self.movies = pd.read_csv(movies_file)
                
                # Không giới hạn số lượng phim để đánh giá
                # (Người dùng có thể đánh giá bất kỳ phim nào trong danh sách)
                
                logger.info(f"Đã tải {len(self.movies)} phim từ {movies_file}")
                
                # Đảm bảo rằng ta có các cột cần thiết
                if 'Id' not in self.movies.columns:
                    logger.warning("Không tìm thấy cột 'Id', tạo cột mới")
                    self.movies['Id'] = range(1, len(self.movies) + 1)
                
                if 'Genres' not in self.movies.columns and 'Genre' in self.movies.columns:
                    logger.info("Đổi tên cột 'Genre' thành 'Genres'")
                    self.movies['Genres'] = self.movies['Genre']
                
                if 'Genres' not in self.movies.columns:
                    logger.warning("Không tìm thấy cột 'Genres', tạo cột mặc định")
                    self.movies['Genres'] = "['Drama']"
                
                if 'Title' not in self.movies.columns:
                    logger.warning("Không tìm thấy cột 'Title', sử dụng tên mặc định")
                    self.movies['Title'] = [f"Movie {i}" for i in range(1, len(self.movies) + 1)]
                
                if 'Vote Average' not in self.movies.columns:
                    logger.warning("Không tìm thấy cột 'Vote Average', tạo giá trị mặc định")
                    self.movies['Vote Average'] = 7.0
                                
            else:
                logger.warning(f"File dữ liệu phim không tồn tại: {movies_file}")
                self._ensure_sample_data()
                # Thử tải lại sau khi tạo dữ liệu mẫu
                if os.path.exists(movies_file):
                    self.movies = pd.read_csv(movies_file)
                else:
                    # Nếu vẫn không thành công, tạo DataFrame trống
                    self.movies = pd.DataFrame(columns=['Id', 'Title', 'Genres', 'Vote Average'])
            
            # Tạo ma trận đặc trưng từ thể loại phim và áp dụng TF-IDF
            self._create_feature_matrix()
            
        except Exception as e:
            logger.error(f"Lỗi khi tải dữ liệu: {str(e)}")
            # Khởi tạo DataFrame trống
            self.movies = pd.DataFrame(columns=['Id', 'Title', 'Genres', 'Vote Average'])
    
    def get_all_movies(self):
        #Lấy danh sách phim
        if self.movies is None or len(self.movies) == 0:
            return []
            
        result = []
        for _, movie in self.movies.iterrows():
            result.append({
                'Id': int(movie['Id']),
                'Title': movie['Title'],
                'Genres': movie['Genres'],
                'Vote_Average': float(movie['Vote Average']) if 'Vote Average' in movie else 7.0
            })
            
        return result
    
    def _parse_genres(self, genres_str):
        #Phân tích chuỗi thể loại thành danh sách
        if not isinstance(genres_str, str):
            return []
            
        try:
            # Thử sử dụng ast để chuyển đổi chuỗi thành list
            return ast.literal_eval(genres_str)
        except (ValueError, SyntaxError):
            # Thử xử lý thủ công
            if '|' in genres_str:
                return genres_str.split('|')
            elif ',' in genres_str:
                return [g.strip(" '\"") for g in genres_str.strip("[]").split(',')]
            else:
                return [genres_str]
    
    def _create_feature_matrix(self):
        #Tạo ma trận đặc trưng từ thể loại phim và áp dụng TF-IDF
        if self.movies is None or len(self.movies) == 0:
            logger.warning("Không có dữ liệu phim để tạo ma trận đặc trưng")
            return
        
        try:
            # Tất cả các thể loại phim
            all_genres = set()
            
            # Xử lý thể loại cho từng phim
            for _, movie in self.movies.iterrows():
                if 'Genres' in movie and movie['Genres']:
                    genres_list = self._parse_genres(movie['Genres'])
                    all_genres.update(genres_list)
            
            genre_list = sorted(list(all_genres))
            
            # Tạo ma trận đặc trưng (1 nếu phim thuộc thể loại đó, 0 nếu không)
            feature_matrix = []
            for _, movie in self.movies.iterrows():
                movie_genres = self._parse_genres(movie['Genres']) if 'Genres' in movie and movie['Genres'] else []
                features = [1 if genre in movie_genres else 0 for genre in genre_list]
                feature_matrix.append(features)
            
            # Chuyển đổi thành numpy array
            self.item_features = np.array(feature_matrix)
            self.genre_list = genre_list
            
            # Áp dụng TF-IDF transformation
            transformer = TfidfTransformer(smooth_idf=True, norm='l2')
            self.item_tfidf = transformer.fit_transform(self.item_features).toarray()
            
            logger.info(f"Đã tạo ma trận đặc trưng với {len(genre_list)} thể loại và áp dụng TF-IDF")
            
        except Exception as e:
            logger.error(f"Lỗi khi tạo ma trận đặc trưng: {str(e)}")
            self.item_features = None
            self.item_tfidf = None
    
    def _get_items_rated_by_user(self, user_ratings):
        #Lấy danh sách các phim và đánh giá của người dùng
        movie_ids = []
        ratings = []
        
        for movie_id, rating in user_ratings.items():
            try:
                # Chuyển đổi string thành int nếu cần
                movie_id_int = int(movie_id)
                # Tìm vị trí của phim trong DataFrame
                movie_idx = self.movies.index[self.movies['Id'] == movie_id_int].tolist()
                if movie_idx:
                    movie_ids.append(movie_idx[0])
                    ratings.append(float(rating))
            except Exception as e:
                logger.error(f"Lỗi khi xử lý đánh giá cho phim {movie_id}: {str(e)}")
                continue
        
        return movie_ids, ratings
    
    def _evaluate_rmse(self, predictions, user_ratings):
        #Tính toán Root Mean Squared Error (RMSE) cho các dự đoán
        ids, actual_ratings = self._get_items_rated_by_user(user_ratings)
        if not ids:
            return float('inf')
        
        predicted_ratings = [predictions[i] for i in ids]
        squared_errors = [(actual - pred) ** 2 for actual, pred in zip(actual_ratings, predicted_ratings)]
        
        return sqrt(sum(squared_errors) / len(squared_errors))
    
    def content_based_recommend(self, user_ratings, n_recommendations=5):
        #Đề xuất phim dựa trên đánh giá của người dùng và nội dung phim
        if self.item_tfidf is None or len(user_ratings) == 0:
            logger.warning("Không đủ dữ liệu để đề xuất")
            return []
        
        try:
            # Lấy chỉ số phim và đánh giá của người dùng
            movie_ids, ratings = self._get_items_rated_by_user(user_ratings)
            
            if not movie_ids:
                logger.warning("Không tìm thấy phim đã đánh giá trong cơ sở dữ liệu")
                return []
            
            # Matrix X chứa đặc trưng TF-IDF của các phim đã được đánh giá
            X = self.item_tfidf[movie_ids]
            y = np.array(ratings)
            
            # Huấn luyện mô hình Ridge Regression
            model = Ridge(alpha=0.01, fit_intercept=True)
            model.fit(X, y)
            
            # Lấy trọng số của các đặc trưng để hiểu sở thích người dùng
            feature_weights = model.coef_
            user_bias = model.intercept_
            
            logger.info(f"Trọng số đặc trưng: {list(zip(self.genre_list, feature_weights))}")
            logger.info(f"Bias của người dùng: {user_bias}")
            
            # Dự đoán đánh giá cho tất cả các phim
            all_predictions = model.predict(self.item_tfidf)
            
            # Lọc ra các phim chưa được đánh giá
            rated_movies = set(movie_ids)
            candidates = [(i, score) for i, score in enumerate(all_predictions) 
                        if i not in rated_movies]
            
            # Sắp xếp theo điểm dự đoán (cao nhất đầu tiên)
            candidates.sort(key=lambda x: x[1], reverse=True)
            
            # Lấy top n_recommendations
            top_recommendations = candidates[:n_recommendations]
            
            # Tính RMSE cho các phim đã đánh giá (để thông báo)
            rmse = self._evaluate_rmse(all_predictions, user_ratings)
            logger.info(f"RMSE cho các đánh giá đã biết: {rmse}")
            
            # Tạo kết quả trả về
            result = []
            for idx, score in top_recommendations:
                if idx < len(self.movies):
                    movie = self.movies.iloc[idx]
                    result.append({
                        'movie_id': int(movie['Id']),
                        'title': movie['Title'],
                        'genres': movie['Genres'],
                        'overview': movie.get('Overview', 'Không có mô tả cho phim này.'),
                        'predicted_rating': round(float(score), 2),
                        'score': round(min(float(score) / 5 * 100, 100), 1)  # Chuyển đổi sang thang điểm 100
                    })
            
            logger.info(f"Đã đề xuất {len(result)} phim dựa trên {len(movie_ids)} đánh giá")
            return result
            
        except Exception as e:
            logger.error(f"Lỗi khi đề xuất dựa trên nội dung: {str(e)}")
            return []
    
    def collaborative_recommend(self, user_id, n_recommendations=5):
        # Tạo kết quả mẫu dựa trên 10 phim đầu tiên trong dataset
        try:
            if self.movies is None or len(self.movies) == 0:
                return []
                
            # Lấy 3 bộ phim với điểm đánh giá cao nhất để gợi ý
            top_movies = self.movies.sort_values(by='Vote Average', ascending=False).head(3)
            
            recommendations = []
            for _, movie in top_movies.iterrows():
                recommendations.append({
                    'movie_id': int(movie['Id']),
                    'title': movie['Title'],
                    'genres': movie['Genres'],
                    'predicted_rating': round(float(movie['Vote Average']) / 2, 2),  # Chuyển đổi xuống thang 5
                    'score': round(min(float(movie['Vote Average']) / 10 * 100, 100), 1)  # Thang điểm 100
                })
                
            return recommendations
        except Exception as e:
            logger.error(f"Lỗi khi đề xuất dựa trên lọc cộng tác: {str(e)}")
            return []
    
    def context_aware_recommend(self, location, time=None, n_recommendations=5):
        #Đề xuất phim dựa trên ngữ cảnh (vị trí, thời gian)
        try:
            if self.movies is None or len(self.movies) == 0:
                return []
                
            # Lấy 2 bộ phim phổ biến nhất để gợi ý cho rạp gần đó
            if 'Vote Count' in self.movies.columns:
                popular_movies = self.movies.sort_values(by='Vote Count', ascending=False).head(2)
            else:
                popular_movies = self.movies.sort_values(by='Vote Average', ascending=False).head(2)
            
            recommendations = []
            for i, (_, movie) in enumerate(popular_movies.iterrows()):
                movie_time = f"{19 + i}:30" if time is None else time
                recommendations.append({
                    'movie_id': int(movie['Id']),
                    'title': f"Now Showing: {movie['Title']}",
                    'genres': movie['Genres'],
                    'predicted_rating': round(float(movie['Vote Average']) / 2, 2),  # Chuyển đổi xuống thang 5
                    'score': round(min(float(movie['Vote Average']) / 10 * 100, 100), 1),  # Thang điểm 100
                    'location': location,
                    'time': movie_time
                })
                
            return recommendations
        except Exception as e:
            logger.error(f"Lỗi khi đề xuất dựa trên ngữ cảnh: {str(e)}")
            return []

# Hàm helper để lấy đối tượng RecommendationSystem
_recommendation_system = None

def get_recommendation_system():
    global _recommendation_system
    if _recommendation_system is None:
        _recommendation_system = RecommendationSystem()
    return _recommendation_system 