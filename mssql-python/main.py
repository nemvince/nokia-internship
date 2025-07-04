"""
TopBikes Database Visualization Script
Creates comprehensive visualizations of sales, products, and customer data
"""

import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime
import warnings
import time
warnings.filterwarnings('ignore')

from pyodbc import connect

# Database connection configuration
CONNSTR = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=mate-test-sqlserver.database.windows.net;DATABASE=TopBike;UID=tanfolyam;PWD=vx#34T6k*E12;"
conn = connect(CONNSTR)

# global query counter
query_counter = 0
total_sql_time = 0

def get_data(query):
    start = time.time()

    """Execute SQL query and return results as pandas DataFrame"""
    if conn is None:
        return None
    
    try:
        df = pd.read_sql_query(query, conn)
        global query_counter
        query_counter += 1
        return df
    except Exception as e:
        print(f"Error executing query: {e}")
        return None
    finally:
        end = time.time()
        global total_sql_time
        total_sql_time += end - start

def setup_plot_style():
    """Configure seaborn and matplotlib styling"""
    sns.set_style("whitegrid")
    sns.set_palette("husl")
    plt.rcParams['figure.figsize'] = (12, 8)
    plt.rcParams['font.size'] = 10

def create_sales_performance_analysis():
    """Create comprehensive sales performance visualizations"""
    
    # Query for sales performance data
    sales_query = """
    SELECT 
        oh.OrderDate,
        oh.OrderID,
        oh.SubTotal,
        sp.SalesPersonName,
        sp.HiredAt,
        c.City,
        c.Country,
        YEAR(oh.OrderDate) as OrderYear,
        MONTH(oh.OrderDate) as OrderMonth,
        DATENAME(MONTH, oh.OrderDate) as MonthName
    FROM OrderHeaders oh
    LEFT JOIN SalesPerson sp ON oh.SalesPersonID = sp.SalesPersonID
    LEFT JOIN Customer c ON oh.CustomerID = c.CustomerID
    WHERE oh.OrderDate IS NOT NULL
    """
    
    sales_df = get_data(sales_query)
    if sales_df is None:
        print("Failed to retrieve sales data")
        return
    
    # Filter out 0 or negative sales
    sales_df = sales_df[sales_df['SubTotal'] > 1]
    
    # Convert date columns
    sales_df['OrderDate'] = pd.to_datetime(sales_df['OrderDate'])
    sales_df['HiredAt'] = pd.to_datetime(sales_df['HiredAt'])
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('Sales Performance Analysis', fontsize=16, fontweight='bold')
    
    # 1. Monthly sales trend
    monthly_sales = sales_df.groupby(['OrderYear', 'OrderMonth'])['SubTotal'].sum().reset_index()
    monthly_sales['YearMonth'] = monthly_sales['OrderYear'].astype(str) + '-' + monthly_sales['OrderMonth'].astype(str).str.zfill(2)
    monthly_sales = monthly_sales.sort_values('YearMonth')
    
    sns.lineplot(data=monthly_sales, x='YearMonth', y='SubTotal', ax=axes[0,0], marker='o')
    axes[0,0].set_title('Monthly Sales Trend')
    axes[0,0].set_xlabel('Year-Month')
    axes[0,0].set_ylabel('Total Sales ($)')
    axes[0,0].tick_params(axis='x', rotation=45)
    
    # 2. Top performing salespeople
    if 'SalesPersonName' in sales_df.columns:
        salesperson_performance = sales_df.groupby('SalesPersonName')['SubTotal'].agg(['sum', 'count']).reset_index()
        salesperson_performance.columns = ['SalesPersonName', 'TotalSales', 'OrderCount']
        top_salespeople = salesperson_performance.nlargest(10, 'TotalSales')
        
        sns.barplot(data=top_salespeople, x='TotalSales', y='SalesPersonName', ax=axes[0,1])
        axes[0,1].set_title('Top 10 Salespeople by Revenue')
        axes[0,1].set_xlabel('Total Sales ($)')
    
    # 3. Sales by country
    if 'Country' in sales_df.columns:
        country_sales = sales_df.groupby('Country')['SubTotal'].sum().reset_index()
        country_sales = country_sales.nlargest(10, 'SubTotal')
        
        sns.barplot(data=country_sales, x='SubTotal', y='Country', ax=axes[1,0])
        axes[1,0].set_title('Top 10 Countries by Sales')
        axes[1,0].set_xlabel('Total Sales ($)')
    
    # 4. Sales distribution
    sns.histplot(data=sales_df, x='SubTotal', kde=True, ax=axes[1,1])
    axes[1,1].set_title('Sales Order Value Distribution')
    axes[1,1].set_xlabel('Order Value ($)')
    axes[1,1].set_ylabel('Frequency')
    
    plt.tight_layout()
    plt.savefig("sales_performance.png")

def create_product_analysis():
    """Create product performance and analysis visualizations"""
    
    # Query for product analysis
    product_query = """
    SELECT 
        p.Name as ProductName,
        p.ProductLine,
        p.Class,
        p.Color,
        p.ListPrice,
        p.Weight,
        od.OrderQty,
        od.UnitPrice,
        od.LineTotal,
        oh.OrderDate
    FROM Product p
    INNER JOIN OrderDetail od ON p.ProductID = od.ProductID
    INNER JOIN OrderHeaders oh ON od.OrderID = oh.OrderID
    WHERE p.ListPrice > 0
    """
    
    product_df = get_data(product_query)
    if product_df is None:
        print("Failed to retrieve product data")
        return
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('Product Analysis', fontsize=16, fontweight='bold')
    
    # 1. Top products by revenue
    product_revenue = product_df.groupby('ProductName')['LineTotal'].sum().reset_index()
    top_products = product_revenue.nlargest(15, 'LineTotal')
    
    sns.barplot(data=top_products, x='LineTotal', y='ProductName', ax=axes[0,0])
    axes[0,0].set_title('Top 15 Products by Revenue')
    axes[0,0].set_xlabel('Total Revenue ($)')
    
    # 2. Product line performance
    if 'ProductLine' in product_df.columns:
        productline_performance = product_df.groupby('ProductLine')['LineTotal'].sum().reset_index()
        
        sns.barplot(data=productline_performance, x='ProductLine', y='LineTotal', ax=axes[0,1])
        axes[0,1].set_title('Revenue by Product Line')
        axes[0,1].set_xlabel('Product Line')
        axes[0,1].set_ylabel('Total Revenue ($)')
        axes[0,1].tick_params(axis='x', rotation=45)
    
    # 3. Price vs quantity relationship
    if 'UnitPrice' in product_df.columns and 'OrderQty' in product_df.columns:
        # Sample data for better visualization if dataset is large
        sample_df = product_df.sample(n=min(1000, len(product_df)))
        
        sns.scatterplot(data=sample_df, x='UnitPrice', y='OrderQty', 
                       hue='ProductLine', alpha=0.6, ax=axes[1,0])
        axes[1,0].set_title('Price vs Quantity Ordered')
        axes[1,0].set_xlabel('Unit Price ($)')
        axes[1,0].set_ylabel('Order Quantity')
    
    # 4. Product class distribution
    if 'Class' in product_df.columns:
        class_counts = product_df['Class'].value_counts()
        
        sns.barplot(x=class_counts.index, y=class_counts.values, ax=axes[1,1])
        axes[1,1].set_title('Product Class Distribution')
        axes[1,1].set_xlabel('Product Class')
        axes[1,1].set_ylabel('Number of Orders')
    
    plt.tight_layout()
    plt.savefig("product_analysis.png")

def create_customer_analysis():
    """Create customer behavior and geographic analysis"""
    
    # Query for customer analysis
    customer_query = """
    SELECT 
        c.CustomerID,
        c.City,
        c.Country,
        c.Title,
        oh.OrderDate,
        oh.SubTotal,
        COUNT(oh.OrderID) as OrderCount,
        SUM(oh.SubTotal) as TotalSpent
    FROM Customer c
    INNER JOIN OrderHeaders oh ON c.CustomerID = oh.CustomerID
    GROUP BY c.CustomerID, c.City, c.Country, c.Title, oh.OrderDate, oh.SubTotal
    """
    
    customer_df = get_data(customer_query)
    if customer_df is None:
        print("Failed to retrieve customer data")
        return

    # Filter out customers with no orders
    customer_df = customer_df[customer_df['TotalSpent'] > 0]
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('Customer Analysis', fontsize=16, fontweight='bold')
    
    # 1. Customer spending distribution
    customer_totals = customer_df.groupby('CustomerID')['TotalSpent'].sum().reset_index()
    
    sns.histplot(data=customer_totals, x='TotalSpent', kde=True, ax=axes[0,0])
    axes[0,0].set_title('Customer Spending Distribution')
    axes[0,0].set_xlabel('Total Spent ($)')
    axes[0,0].set_ylabel('Number of Customers')
    
    # 2. Top cities by customer count
    if 'City' in customer_df.columns:
        city_customers = customer_df.groupby('City')['CustomerID'].nunique().reset_index()
        city_customers.columns = ['City', 'CustomerCount']
        top_cities = city_customers.nlargest(10, 'CustomerCount')
        
        sns.barplot(data=top_cities, x='CustomerCount', y='City', ax=axes[0,1])
        axes[0,1].set_title('Top 10 Cities by Customer Count')
        axes[0,1].set_xlabel('Number of Customers')
    
    # 3. Customer title distribution
    if 'Title' in customer_df.columns:
        title_counts = customer_df['Title'].value_counts().head(10)
        
        sns.barplot(x=title_counts.values, y=title_counts.index, ax=axes[1,0])
        axes[1,0].set_title('Customer Title Distribution')
        axes[1,0].set_xlabel('Count')
        axes[1,0].set_ylabel('Title')
    
    # 4. Average order value by country
    if 'Country' in customer_df.columns:
        country_avg = customer_df.groupby('Country')['SubTotal'].mean().reset_index()
        country_avg = country_avg.nlargest(10, 'SubTotal')
        
        sns.barplot(data=country_avg, x='SubTotal', y='Country', ax=axes[1,1])
        axes[1,1].set_title('Average Order Value by Country')
        axes[1,1].set_xlabel('Average Order Value ($)')
    
    plt.tight_layout()
    plt.savefig("customer_analysis.png")

def create_seasonal_analysis():
    """Create seasonal and temporal analysis"""
    
    # Query for seasonal analysis
    seasonal_query = """
    SELECT 
        oh.OrderDate,
        oh.SubTotal,
        YEAR(oh.OrderDate) as OrderYear,
        MONTH(oh.OrderDate) as OrderMonth,
        DATENAME(MONTH, oh.OrderDate) as MonthName,
        DATENAME(WEEKDAY, oh.OrderDate) as WeekDay,
        DATEPART(QUARTER, oh.OrderDate) as Quarter
    FROM OrderHeaders oh
    WHERE oh.OrderDate IS NOT NULL
    """
    
    seasonal_df = get_data(seasonal_query)
    if seasonal_df is None:
        print("Failed to retrieve seasonal data")
        return
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('Seasonal and Temporal Analysis', fontsize=16, fontweight='bold')
    
    # 1. Monthly sales pattern
    monthly_avg = seasonal_df.groupby('OrderMonth')['SubTotal'].mean().reset_index()
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_avg['MonthName'] = monthly_avg['OrderMonth'].apply(lambda x: month_names[x-1])
    
    sns.lineplot(data=monthly_avg, x='MonthName', y='SubTotal', ax=axes[0,0], marker='o')
    axes[0,0].set_title('Average Monthly Sales Pattern')
    axes[0,0].set_xlabel('Month')
    axes[0,0].set_ylabel('Average Sales ($)')
    axes[0,0].tick_params(axis='x', rotation=45)
    
    # 2. Quarterly performance
    quarterly_sales = seasonal_df.groupby(['OrderYear', 'Quarter'])['SubTotal'].sum().reset_index()
    
    sns.boxplot(data=quarterly_sales, x='Quarter', y='SubTotal', ax=axes[0,1])
    axes[0,1].set_title('Quarterly Sales Distribution')
    axes[0,1].set_xlabel('Quarter')
    axes[0,1].set_ylabel('Total Sales ($)')
    
    # 3. Day of week analysis
    weekday_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    weekday_sales = seasonal_df.groupby('WeekDay')['SubTotal'].mean().reset_index()
    weekday_sales['WeekDay'] = pd.Categorical(weekday_sales['WeekDay'], categories=weekday_order, ordered=True)
    weekday_sales = weekday_sales.sort_values('WeekDay')
    
    sns.barplot(data=weekday_sales, x='WeekDay', y='SubTotal', ax=axes[1,0])
    axes[1,0].set_title('Average Sales by Day of Week')
    axes[1,0].set_xlabel('Day of Week')
    axes[1,0].set_ylabel('Average Sales ($)')
    axes[1,0].tick_params(axis='x', rotation=45)
    
    # 4. Year-over-year growth
    yearly_sales = seasonal_df.groupby('OrderYear')['SubTotal'].sum().reset_index()
    
    sns.lineplot(data=yearly_sales, x='OrderYear', y='SubTotal', ax=axes[1,1], marker='o')
    axes[1,1].set_title('Year-over-Year Sales Growth')
    axes[1,1].set_xlabel('Year')
    axes[1,1].set_ylabel('Total Sales ($)')
    
    plt.tight_layout()
    plt.savefig("seasonal_analysis.png")

def generate_summary_report():
    """Generate a summary report of key metrics"""
    
    print("\n" + "="*60)
    print("TOPBIKES DATABASE SUMMARY REPORT")
    print("="*60)
    
    # Get basic statistics
    summary_queries = {
        'Total Orders': "SELECT COUNT(*) FROM OrderHeaders",
        'Total Revenue': "SELECT SUM(SubTotal) FROM OrderHeaders",
        'Total Customers': "SELECT COUNT(DISTINCT CustomerID) FROM Customer",
        'Total Products': "SELECT COUNT(*) FROM Product",
        'Active Salespeople': "SELECT COUNT(*) FROM SalesPerson"
    }
    
    for metric, query in summary_queries.items():
        result = get_data(query)
        if result is not None and len(result) > 0:
            value = result.iloc[0, 0]
            if 'Revenue' in metric:
                print(f"{metric}: ${value:,.2f}")
            else:
                print(f"{metric}: {value:,}")
    
    print("="*60)

def main():
    """Main function to run all visualizations"""
    
    start = time.time()

    print("Starting TopBikes Database Visualization Analysis...")
    print("This will create comprehensive visualizations of your sales data.")
    
    # Set up plotting style
    setup_plot_style()
    
    try:
        # Generate summary report
        generate_summary_report()
        
        # Create visualizations
        print("\nCreating Sales Performance Analysis...")
        create_sales_performance_analysis()
        
        print("\nCreating Product Analysis...")
        create_product_analysis()
        
        print("\nCreating Customer Analysis...")
        create_customer_analysis()
        
        print("\nCreating Seasonal Analysis...")
        create_seasonal_analysis()
        
        end = time.time()

        total = end - start

        print(f"\nAll visualizations completed! Total queries: {query_counter}")
        print(f"Total processing time was {total}s,")
        print(f"Out of which {total_sql_time} was taken up by MS SQL.")

    except Exception as e:
        print(f"Error during visualization creation: {e}")
        print("Please check your database connection and data availability.")
    finally:
        conn.close()

if __name__ == "__main__":
    main()

