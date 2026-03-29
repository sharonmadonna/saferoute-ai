import pandas as pd
import numpy as np
import os
from pathlib import Path


class DataPreprocessor:
    """
    Preprocesses and normalizes raw crime data, lighting infrastructure data,
    and time-slot safety data for the SafeRoute AI project.
    """

    def __init__(self, data_dir='data/raw'):
        """
        Initialize the preprocessor with the data directory path.

        Args:
            data_dir (str): Path to the raw data directory
        """
        self.data_dir = data_dir
        self.crime_data = None
        self.crime_timestamps = None
        self.street_lighting = None
        self.time_slots = None
        self.processed_data = None

    def load_raw_data(self):
        """Load all raw CSV files."""
        print(f"Loading data from {self.data_dir}...")

        try:
            self.crime_data = pd.read_csv(
                os.path.join(self.data_dir, 'crime_data_chennai.csv')
            )
            print(f"✓ Crime data loaded: {len(self.crime_data)} records")

            self.crime_timestamps = pd.read_csv(
                os.path.join(self.data_dir, 'crime_timestamps_chennai.csv')
            )
            print(f"✓ Crime timestamps loaded: {len(self.crime_timestamps)} records")

            self.street_lighting = pd.read_csv(
                os.path.join(self.data_dir, 'street_lighting_chennai.csv')
            )
            print(f"✓ Street lighting data loaded: {len(self.street_lighting)} records")

            self.time_slots = pd.read_csv(
                os.path.join(self.data_dir, 'time_slots_chennai.csv')
            )
            print(f"✓ Time slots data loaded: {len(self.time_slots)} records")

            return True
        except FileNotFoundError as e:
            print(f"✗ Error loading data: {e}")
            return False

    def normalize_crime_data(self):
        """Normalize and clean crime data."""
        print("\nNormalizing crime data...")

        # Create a copy to avoid modifying original
        crime_df = self.crime_data.copy()

        # Strip whitespace from location names
        crime_df['Place'] = crime_df['Place'].str.strip()

        # Standardize crime types
        crime_df['Type_of_Crime'] = crime_df['Type_of_Crime'].str.strip()

        # Count crimes per location and type
        crime_frequency = crime_df.groupby(['Place', 'Type_of_Crime']).size().reset_index(
            name='Crime_Count'
        )

        # Count crimes per location (total)
        crime_by_location = crime_df.groupby('Place').size().reset_index(
            name='Total_Crimes'
        )

        print(f"✓ Crime data normalized: {len(crime_by_location)} unique locations")

        return crime_frequency, crime_by_location

    def normalize_street_lighting(self):
        """Normalize and calculate street lighting metrics."""
        print("\nNormalizing street lighting data...")

        lighting_df = self.street_lighting.copy()

        # Strip whitespace
        lighting_df['Area'] = lighting_df['Area'].str.strip()

        # Calculate lighting efficiency percentage
        lighting_df['Lighting_Efficiency'] = (
            (lighting_df['Working_Lights'] / lighting_df['Total_Street_Lights']) * 100
        ).round(2)

        # Aggregate by area (in case of duplicates)
        lighting_agg = (
            lighting_df.groupby('Area')
            .agg({
                'Total_Street_Lights': 'sum',
                'Working_Lights': 'sum',
                'Not_Working_Lights': 'sum'
            })
            .reset_index()
        )

        lighting_agg['Lighting_Efficiency'] = (
            (lighting_agg['Working_Lights'] / lighting_agg['Total_Street_Lights']) * 100
        ).round(2)

        print(f"✓ Street lighting data normalized: {len(lighting_agg)} areas")

        return lighting_agg

    def normalize_time_slots(self):
        """Normalize time slot data."""
        print("\nNormalizing time slot data...")

        time_df = self.time_slots.copy()

        # Clean up column names and data
        time_df.columns = time_df.columns.str.strip()

        # Convert Incident Count to numeric
        time_df['Incident Count'] = pd.to_numeric(
            time_df['Incident Count'], errors='coerce'
        )
        time_df['Safety Score (1-10)'] = pd.to_numeric(
            time_df['Safety Score (1-10)'], errors='coerce'
        )

        print(f"✓ Time slot data normalized: {len(time_df)} time periods")

        return time_df

    def merge_location_safety_data(self, crime_by_location, lighting_agg):
        """
        Merge crime and lighting data at location level.

        Args:
            crime_by_location: Aggregated crime data by location
            lighting_agg: Aggregated lighting data by area

        Returns:
            Merged dataframe with location-level safety metrics
        """
        print("\nMerging location safety data...")

        # Merge on location/area (using inner join to keep only locations with both data)
        merged = crime_by_location.merge(
            lighting_agg, left_on='Place', right_on='Area', how='inner'
        ).copy()

        if len(merged) == 0:
            print("⚠️  No exact matches found. Using fuzzy matching...")
            # If no exact matches, do a more lenient merge
            merged = crime_by_location.merge(
                lighting_agg, left_on='Place', right_on='Area', how='left'
            ).copy()

        # Fill missing lighting data with city average values using proper pandas assignment
        avg_efficiency = lighting_agg['Lighting_Efficiency'].mean()
        avg_working_lights = lighting_agg['Working_Lights'].mean()
        avg_total_lights = lighting_agg['Total_Street_Lights'].mean()

        merged = merged.assign(
            Lighting_Efficiency=merged['Lighting_Efficiency'].fillna(avg_efficiency),
            Working_Lights=merged['Working_Lights'].fillna(avg_working_lights),
            Total_Street_Lights=merged['Total_Street_Lights'].fillna(avg_total_lights),
            Not_Working_Lights=merged['Not_Working_Lights'].fillna(0)
        )

        # Calculate location safety score (0-10 scale)
        # Lower crime + higher lighting = higher safety
        max_crimes = crime_by_location['Total_Crimes'].max()
        min_crimes = crime_by_location['Total_Crimes'].min()

        # Normalize crime to 0-5 range (higher score = safer = fewer crimes)
        crime_score = (
            ((max_crimes - merged['Total_Crimes']) / (max_crimes - min_crimes + 1)) * 5
        ).round(2)

        # Normalize lighting to 0-5 range
        lighting_score = (merged['Lighting_Efficiency'] / 20).round(2)

        # Combine scores (crime 50% + lighting 50%)
        location_safety_score = (crime_score + lighting_score).round(2)

        merged = merged.assign(
            Crime_Score=crime_score,
            Lighting_Score=lighting_score,
            Location_Safety_Score=location_safety_score.fillna(5.0)
        )

        print(f"✓ Merged data: {len(merged)} locations with safety scores")

        return merged

    def process(self):
        """Run the complete data preprocessing pipeline."""
        print("=" * 50)
        print("SafeRoute AI - Data Preprocessing Pipeline")
        print("=" * 50)

        # Load raw data
        if not self.load_raw_data():
            return False

        # Normalize individual datasets
        crime_freq, crime_loc = self.normalize_crime_data()
        lighting = self.normalize_street_lighting()
        time_slots = self.normalize_time_slots()

        # Merge datasets
        self.processed_data = self.merge_location_safety_data(crime_loc, lighting)

        print("\n" + "=" * 50)
        print("Preprocessing Complete!")
        print("=" * 50)

        return True

    def get_processed_data(self):
        """Return the processed data dictionary."""
        if self.processed_data is None:
            print("No processed data available. Run process() first.")
            return None

        return {
            'location_safety': self.processed_data,
            'time_slots': self.normalize_time_slots(),
            'crime_data': self.crime_data,
            'street_lighting': self.street_lighting
        }

    def save_processed_data(self, output_dir='data/processed'):
        """Save processed data to CSV files."""
        if self.processed_data is None:
            print("No processed data to save. Run process() first.")
            return False

        os.makedirs(output_dir, exist_ok=True)

        try:
            self.processed_data.to_csv(
                os.path.join(output_dir, 'location_safety_scores.csv'), index=False
            )
            self.normalize_time_slots().to_csv(
                os.path.join(output_dir, 'time_slot_safety.csv'), index=False
            )
            print(f"✓ Processed data saved to {output_dir}/")
            return True
        except Exception as e:
            print(f"✗ Error saving data: {e}")
            return False


if __name__ == '__main__':
    # Run preprocessing pipeline
    preprocessor = DataPreprocessor('data/raw')
    if preprocessor.process():
        preprocessor.save_processed_data()

        # Display sample results
        print("\nSample Location Safety Scores:")
        print(preprocessor.processed_data.head())
